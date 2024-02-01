const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');

const app = express();

const PORT = 3000; // Define the port number

app.get('/', (req, res) => {
    res.send('Welcome to the Google Form Webhook Server');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  try {
    //const parameters = req.body.queryResult.parameters;
    const nameFromDialogflow = request.body.queryResult.parameters.$name;

    // Now you can format the data for the Google Form
    const formData = {
    'entry.711600439': nameFromDialogflow,
    // Add more form entries as needed
    };

    console.log('Received data from Dialogflow:', nameFromDialogflow);


    // Authenticate using the service account credentials
    const auth = await authenticateServiceAccount();
    
    // Submit form data to Google Form
    await axios.post('https://docs.google.com/forms/d/e/1FAIpQLSdtR0SJRowjWV5SMH4qa8SXTXkBIlmv-hcoVfYUEeNGGs-oig/formResponse', formData, {
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    console.log('Form submission successful');
    res.json({ fulfillmentText: 'Form submitted successfully!' });
    } catch (error) {
        console.error('Error submitting form:', error);
        console.error(error.stack); // Add this line to print the stack trace
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

// GET route for "/webhook"
app.get('/webhook', (req, res) => {
    res.send('GET request to /webhook received. Use POST for webhook.');
});

async function authenticateServiceAccount() {
  const credentials = require('.filling/service-account-key.json');
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
