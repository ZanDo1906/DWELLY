const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Concept model
const Concept = require('../models/Concept');

const extractConceptUploadFilename = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string' || !imagePath.includes('/uploads/concepts/')) {
    return null;
  }

  const cleanPath = imagePath.split('?')[0]?.split('#')[0] ?? imagePath;
  const rawFilename = cleanPath.split('/').pop();
  if (!rawFilename) {
    return null;
  }

  const filename = path.basename(rawFilename);
  if (!filename || filename.includes('..')) {
    return null;
  }

  return filename;
};

const deleteConceptImageIfLocal = (imagePath) => {
  const filename = extractConceptUploadFilename(imagePath);
  if (!filename) {
    return;
  }

  const fullPath = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', 'concepts', filename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

// get all concepts
router.get("/concepts", async (req, res) => {
  try {
    const concepts = await Concept.find();
    res.json(concepts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get concept by Ma_khong_gian
router.get("/concepts/:id", async (req, res) => {
  try {
    const concept = await Concept.findOne({ Ma_khong_gian: req.params.id });
    if (!concept) {
      return res.status(404).json({ message: "Concept không tồn tại" });
    }
    res.json(concept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// create concept
router.post("/concepts", async (req, res) => {
  try {
    const { Ma_khong_gian } = req.body;

    if (!Ma_khong_gian) {
      return res.status(400).json({ message: "Thiếu Ma_khong_gian" });
    }

    const existedConcept = await Concept.findOne({ Ma_khong_gian });
    if (existedConcept) {
      return res.status(409).json({ message: "Mã concept đã tồn tại" });
    }

    const concept = new Concept(req.body);
    const savedConcept = await concept.save();
    res.status(201).json(savedConcept);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// update concept by Ma_khong_gian
router.patch("/concepts/:id", async (req, res) => {
  try {
    const conceptId = req.params.id;
    const updateData = { ...req.body, updatedAt: new Date() };

    const currentConcept = await Concept.findOne({ Ma_khong_gian: conceptId });
    if (!currentConcept) {
      return res.status(404).json({ message: "Concept không tồn tại" });
    }

    const previousImage = currentConcept.Hinh_anh;

    if (updateData.Ma_khong_gian && updateData.Ma_khong_gian !== conceptId) {
      const existedConcept = await Concept.findOne({ Ma_khong_gian: updateData.Ma_khong_gian });
      if (existedConcept) {
        return res.status(409).json({ message: "Mã concept mới đã tồn tại" });
      }
    }

    const updatedConcept = await Concept.findOneAndUpdate(
      { Ma_khong_gian: conceptId },
      updateData,
      { new: true, runValidators: true }
    );

    if (updateData.Hinh_anh && updateData.Hinh_anh !== previousImage) {
      deleteConceptImageIfLocal(previousImage);
    }

    res.json(updatedConcept);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// delete concept by Ma_khong_gian
router.delete("/concepts/:id", async (req, res) => {
  try {
    const deletedConcept = await Concept.findOneAndDelete({ Ma_khong_gian: req.params.id });

    if (!deletedConcept) {
      return res.status(404).json({ message: "Concept không tồn tại" });
    }

    deleteConceptImageIfLocal(deletedConcept.Hinh_anh);

    res.json({ message: "Đã xóa concept thành công", concept: deletedConcept });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
