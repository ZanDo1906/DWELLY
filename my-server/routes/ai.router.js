const express = require("express");
const axios = require("axios");
const multer = require("multer");

const router = express.Router();
const upload = multer();

router.post("/generate-room", upload.single("image"), async (req, res) => {
  try {
    const { products } = req.body;

    // 🧠 1. Gọi Gemini
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Create a realistic interior design prompt with furniture: ${products}.
                Keep original room layout, realistic lighting, soft shadows`
              }
            ]
          }
        ]
      }
    );

    const prompt =
      geminiRes.data.candidates[0].content.parts[0].text;

    console.log("PROMPT:", prompt);

    // 🎨 2. Stable Diffusion
    const sdRes = await axios.post(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting",
      {
        inputs: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
        responseType: "arraybuffer",
      }
    );

    const base64 = Buffer.from(sdRes.data).toString("base64");

    res.json({
      image: `data:image/png;base64,${base64}`,
      prompt,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "AI lỗi" });
  }
});

module.exports = router;