const { OCRService } = require('../../app/services/ocr/ocrService.cjs');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const ocrController = {
  processImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const ocrService = new OCRService();
      const results = await ocrService.processImage(req.file.buffer);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error processing OCR:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process image'
      });
    }
  }
};

module.exports = ocrController;
