const express = require('express');
const multer = require('multer');
const { processImage } = require('../controllers/ocrController');

const router = express.Router();
const upload = multer();

// OCR processing route
router.post('/process', upload.single('image'), processImage);

module.exports = router;
