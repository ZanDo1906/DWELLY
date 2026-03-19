const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');

// 👇 đọc file từ request
const upload = multer({ storage: multer.memoryStorage() });

// 🔥 API Lovable
const LOVABLE_API_URL = 'https://bwmzodntdjkjcawrkxqe.supabase.co/functions/v1/room-visualizer';

// 👇 API chính
router.post('/room-visualizer', upload.single('image'), async (req, res) => {
  try {
    console.log('API room-visualizer được gọi');

    const image = req.file;

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // 👇 parse furniture đúng cách
    let furniture = [];
    try {
      furniture = JSON.parse(req.body.furniture || '[]');
    } catch (e) {
      furniture = [];
    }

    // 👇 nếu rỗng thì set default
    if (!furniture.length) {
      furniture = ['sofa-modern'];
    }

    console.log('Furniture:', furniture);

    // Upstream API expects a data URL, not raw base64.
    const base64Image = image.buffer.toString('base64');
    const mimeType = image.mimetype || 'image/jpeg';
    const roomImageDataUrl = `data:${mimeType};base64,${base64Image}`;

    // Supabase edge function expects these exact keys.
    const requestPayload = {
      roomImageBase64: roomImageDataUrl,
      productNames: furniture
    };

    const response = await axios.post(
      LOVABLE_API_URL,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bXpvZG50ZGpramNhd3JreHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTgwOTUsImV4cCI6MjA4OTM5NDA5NX0.dugTmKVdNCqIYf_-hjZwu0ztUI9UUXDPioNznRg6Mjg',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bXpvZG50ZGpramNhd3JreHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTgwOTUsImV4cCI6MjA4OTM5NDA5NX0.dugTmKVdNCqIYf_-hjZwu0ztUI9UUXDPioNznRg6Mjg'
        }
      }
    );

    console.log('AI response:', response.data);

    const imageUrl = response.data?.imageUrl || response.data?.image;

    if (!imageUrl) {
      return res.status(500).json({
        message: 'AI did not return an image URL',
        error: response.data
      });
    }

    return res.json({ image: imageUrl });

  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);

    return res.status(500).json({
      message: 'AI error',
      error: err.response?.data || err.message
    });
  }
});

module.exports = router;