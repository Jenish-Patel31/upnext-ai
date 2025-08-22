// // geminiService.js
// import express from 'express';
// import axios from 'axios';

// const router = express.Router();

// const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// router.post('/', async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     const response = await axios.post(
//       `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
//       {
//         contents: [
//           {
//             role: 'user',
//             parts: [{ text: prompt }],
//           },
//         ],
//       }
//     );

//     const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
//     res.status(200).json({ reply: text });
//   } catch (error) {
//     console.error('Gemini Error:', error?.response?.data || error.message);
//     res.status(500).json({ error: 'Gemini API request failed.' });
//   }
// });

// export default router;



// services/geminiService.js
import axios from 'axios';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export async function askGemini(prompt) {
  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text;
  } catch (error) {
    console.error('Gemini API Error:', error?.response?.data || error.message);
    throw new Error('Failed to generate response from Gemini');
  }
}

