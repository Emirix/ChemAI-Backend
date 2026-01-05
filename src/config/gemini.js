const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration for the model
const modelConfig = {
    // User explicitly requested gemini-2.5-flash
    model: "gemini-2.5-flash",
    generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
        topP: 1,
        topK: 32,
        responseMimeType: "application/json",
    },
};

module.exports = {
    genAI,
    modelConfig
};
