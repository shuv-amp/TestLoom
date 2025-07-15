const OCRQuestionParser = require('../services/ocrService');
const OCRUtils = require('../services/ocrUtils');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const uploadDir = process.env.UPLOAD_PATH || './uploads';
OCRUtils.ensureUploadDirectory(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = OCRUtils.generateFileName(file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 5
  },
  fileFilter: (req, file, cb) => {
    const validation = OCRUtils.validateImageFile(file);
    if (validation.isValid) {
      cb(null, true);
    } else {
      cb(new Error(validation.errors.join(', ')), false);
    }
  }
});

const ocrController = {
  processImage: async (req, res) => {
    const startTime = Date.now();
    let tempFilePath = null;

    try {
      if (!req.file) {
        return res.status(400).json(OCRUtils.formatErrorResponse(
          new Error('No file uploaded'), 400
        ));
      }

      tempFilePath = req.file.path;
      const ocrParser = new OCRQuestionParser({
        language: process.env.OCR_LANGUAGE || 'eng'
      });

      const questions = await ocrParser.processImageToQuestions(tempFilePath, {
        tesseractOptions: OCRUtils.preprocessImageForOCR(tempFilePath).tesseractOptions
      });

      const validation = ocrParser.validateQuestions(questions);
      const processingTime = Date.now() - startTime;

      const responseData = OCRUtils.formatOCRResponse(
        validation.validQuestions,
        processingTime,
        {
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          totalExtracted: validation.totalProcessed,
          validQuestions: validation.validCount,
          errors: validation.errors
        }
      );

      res.json(responseData);

    } catch (error) {
      console.error('Error processing OCR:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json(OCRUtils.formatErrorResponse(
        new Error(`OCR processing failed: ${error.message}`), 500
      ));
    } finally {
      if (tempFilePath) {
        await OCRUtils.cleanupTempFile(tempFilePath);
      }
    }
  },

  processBatchImages: async (req, res) => {
    const startTime = Date.now();
    const tempFiles = [];

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json(OCRUtils.formatErrorResponse(
          new Error('No files uploaded'), 400
        ));
      }

      const ocrParser = new OCRQuestionParser({
        language: process.env.OCR_LANGUAGE || 'eng'
      });

      const results = [];

      for (const file of req.files) {
        tempFiles.push(file.path);
        
        try {
          const questions = await ocrParser.processImageToQuestions(file.path, {
            tesseractOptions: OCRUtils.preprocessImageForOCR(file.path).tesseractOptions
          });

          const validation = ocrParser.validateQuestions(questions);

          results.push({
            fileName: file.originalname,
            fileSize: file.size,
            questions: validation.validQuestions,
            totalExtracted: validation.totalProcessed,
            validCount: validation.validCount,
            errors: validation.errors,
            success: true
          });

        } catch (fileError) {
          results.push({
            fileName: file.originalname,
            fileSize: file.size,
            questions: [],
            error: fileError.message,
            success: false
          });
        }
      }

      const processingTime = Date.now() - startTime;
      const totalQuestions = results.reduce((sum, result) => sum + (result.questions?.length || 0), 0);

      res.json({
        success: true,
        data: {
          results,
          summary: {
            totalFiles: req.files.length,
            totalQuestions,
            processingTime: `${processingTime}ms`,
            processedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error processing batch OCR:', error);
      res.status(500).json(OCRUtils.formatErrorResponse(
        new Error(`Batch OCR processing failed: ${error.message}`), 500
      ));
    } finally {
      for (const filePath of tempFiles) {
        await OCRUtils.cleanupTempFile(filePath);
      }
    }
  },

  processTextInput: async (req, res) => {
    const startTime = Date.now();

    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json(OCRUtils.formatErrorResponse(
          new Error('No text provided or invalid text format'), 400
        ));
      }

      const ocrParser = new OCRQuestionParser();
      const questions = ocrParser.parseQuestionsFromText(text);
      const validation = ocrParser.validateQuestions(questions);
      const processingTime = Date.now() - startTime;

      const responseData = OCRUtils.formatOCRResponse(
        validation.validQuestions,
        processingTime,
        {
          inputLength: text.length,
          totalExtracted: validation.totalProcessed,
          validQuestions: validation.validCount,
          errors: validation.errors
        }
      );

      res.json(responseData);

    } catch (error) {
      console.error('Error processing text input:', error);
      res.status(500).json(OCRUtils.formatErrorResponse(
        new Error(`Text processing failed: ${error.message}`), 500
      ));
    }
  }
};

module.exports = { ocrController, upload };

module.exports = ocrController;
