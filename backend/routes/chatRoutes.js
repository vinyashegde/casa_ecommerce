// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: 'Message is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
    const result = await model.generateContent(message);
    
    // ✅ FIX: Ensure the reply is always a string.
    // Use optional chaining and a fallback to guarantee a string response.
    const text = result?.response?.text?.();
    const reply = typeof text === 'string' ? text : 'Sorry, I could not generate a response.';

    res.json({ reply });

  } catch (err) {
    console.error('Google AI Error:', err);
    // Also ensure the error response is consistent
    res.status(500).json({ reply: 'Something went wrong with the AI service.' });
  }
});

module.exports = router;