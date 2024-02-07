const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');

const app = express();
const PORT = 3000; // Define the port number
const SUBMISSION_DELAY = 2000; 

app.get('/', (req, res) => {
    res.send('Welcome to the Google Form Webhook Server');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(bodyParser.json());

let isSubmitting = false;

app.post('/webhook', async (req, res) => {
  try {
    if (isSubmitting) {
      console.log('Submission in progress. Adding delay...');
      await delay(SUBMISSION_DELAY);
    }

    isSubmitting = true;

    // Log the entire request body to inspect its structure
    console.log('Received request body:', req.body);

    // Extract the personame parameter
    const nameFromDialogflow = req.body.queryResult.parameters.personame;

    // Now you can format the data for the Google Form
    const formData = {
      'entry.711600439': nameFromDialogflow,
      // Add more form entries as needed
    };

    console.log('Received data from Dialogflow:', nameFromDialogflow);

    // Authenticate using the service account credentials
    const auth = await authenticateServiceAccount();
    
    // Submit form data to Google Form
    try {
      const response = await axios.post('https://docs.google.com/forms/u/0/d/e/1FAIpQLSdtR0SJRowjWV5SMH4qa8SXTXkBIlmv-hcoVfYUEeNGGs-oig/formResponse', formData, {
        headers: {
          Authorization: `Bearer ${auth}`,
        },
        // Convert form data object to URL encoded form data
        data: new URLSearchParams(formData),
      });

      // Check HTTP response status
      if (response.status === 200) {
        console.log('Form submission successful');
        res.json({ fulfillmentText: 'Form submitted successfully!' });
      } else {
        console.error('Error submitting form. HTTP status:', response.status);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      console.error(error.stack); // Add this line to print the stack trace
      
      // Check if the error message indicates a field ID mismatch
      if (error.response && error.response.data && error.response.data.includes('entry.433862652')) {
        console.error('Field ID mismatch error. Please check the field ID in your Google Form.');
        // You can choose to handle this error differently, e.g., send a specific response to Dialogflow
      }

      res.status(500).json({ error: 'Internal Server Error' });
    }
  } finally {
    isSubmitting = false;
  }
});

// GET route for "/webhook"
app.get('/webhook', (req, res) => {
    res.send('GET request to /webhook received. Use POST for webhook.');
});

async function authenticateServiceAccount() {
  const credentials = require('./service-account-key.json');
  const { client_email, private_key } = credentials;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email,
      private_key,
    },
    scopes: 'https://www.googleapis.com/auth/forms',
  });

  const authClient = await auth.getClient();
  const token = await authClient.getAccessToken();
  return token.token;
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
