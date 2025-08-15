// Filename: netlify/functions/gemini-proxy.js
// This code should be deployed as a Netlify serverless function.
// The GEMINI_API_KEY environment variable must be configured on Netlify.

// Import the necessary library for Netlify functions
// You may need to run 'npm install @google/generative-ai' in your functions directory.
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // Check if the request method is POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // Ensure the API key is set as an environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY environment variable is not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: API key missing.' }),
        };
    }
    
    // Parse the request body from the front-end
    const requestBody = JSON.parse(event.body);

    // Initialize the Generative AI model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview-05-20",
      generationConfig: requestBody.generationConfig
    });

    try {
        // Construct the chat history and call the model
        const chatHistory = requestBody.contents;
        const result = await model.generateContent({ contents: chatHistory });
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidates: [{
                    content: {
                        parts: [{ text: text }]
                    }
                }]
            }),
        };

    } catch (error) {
        console.error("Error from Gemini API:", error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: 'Error calling the Gemini API.', details: error.message }),
        };
    }
};

