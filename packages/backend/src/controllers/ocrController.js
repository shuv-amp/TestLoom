const ocrService = require('../services/ocrService');
const fs = require('fs').promises;

const getQuestionTypeSummary = (questions) => {
  const summary = {};
  questions.forEach(q => {
    summary[q.questionType] = (summary[q.questionType] || 0) + 1;
  });
  return summary;
};

const calculateOverallConfidence = (questions) => {
  if (questions.length === 0) return 0;
  const totalConfidence = questions.reduce((sum, q) => sum + (q.confidence || 0.5), 0);
  return Math.round((totalConfidence / questions.length) * 100) / 100;
};

const formatQuestionForVerification = (question) => {
  // Always convert options to array for MCQ
  let optionsArray = [];
  if (question.options) {
    if (Array.isArray(question.options)) {
      optionsArray = question.options.map(opt => ({ label: opt.label, text: opt.text }));
    } else if (typeof question.options === 'object') {
      // Convert object to array, preserving label and text
      optionsArray = Object.entries(question.options).map(([label, text]) => ({ label, text }));
    }
    return {
      id: question.id,
      questionText: question.questionText,
      options: optionsArray
    };
  }
  // For other types, only id and questionText
  return {
    id: question.id,
    questionText: question.questionText
  };
};

const uploadImage = async (req, res) => {
  let responded = false;
  function safeRespond(status, payload) {
    if (!responded && !res.headersSent) {
      responded = true;
      res.status(status).json(payload);
    }
  }
  req.on('close', () => {
    if (!responded) {
      responded = true;
      // Optionally log or clean up
    }
  });
  try {
    if (!req.file) {
      return safeRespond(400, {
        success: false,
        message: 'No image file uploaded'
      });
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path);
      return safeRespond(400, {
        success: false,
        message: 'Invalid file type. Please upload JPEG, PNG, BMP, or TIFF images only.'
      });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      await fs.unlink(req.file.path);
      return safeRespond(400, {
        success: false,
        message: 'File size too large. Maximum size allowed is 10MB.'
      });
    }

    const imageBuffer = await fs.readFile(req.file.path);

    // Enhanced OCR processing
    console.log('Starting enhanced OCR processing...');
    let ocrResult;
    try {
      ocrResult = await ocrService.extractTextFromImage(imageBuffer, {
        subject: req.body.subject,
        expectedQuestionCount: req.body.expectedQuestionCount
      });
    } catch (ocrError) {
      await fs.unlink(req.file.path);
      return safeRespond(500, {
        success: false,
        message: 'OCR extraction failed',
        error: process.env.NODE_ENV === 'development' ? ocrError.message : 'Internal server error'
      });
    }

    // Enhanced question parsing
    console.log('Starting enhanced question parsing...');
    let parsedQuestions = [];
    try {
      parsedQuestions = await ocrService.parseQuestions(ocrResult.text, {
        subject: req.body.subject,
        expectedQuestionCount: req.body.expectedQuestionCount
      });
    } catch (parseError) {
      await fs.unlink(req.file.path);
      return safeRespond(500, {
        success: false,
        message: 'Question parsing failed',
        error: process.env.NODE_ENV === 'development' ? parseError.message : 'Internal server error'
      });
    }
    await fs.unlink(req.file.path);
    const processingTime = Date.now() - Date.now();
    safeRespond(200, {
      success: true,
      message: 'Image processed successfully with enhanced OCR',
      data: {
        summary: {
          totalQuestionsFound: parsedQuestions.length,
          questionTypes: getQuestionTypeSummary(parsedQuestions),
          confidence: calculateOverallConfidence(parsedQuestions),
          processingTime,
          ocrConfidence: ocrResult.confidence,
          parsingMethod: parsedQuestions[0]?.metadata?.method || 'unknown'
        },
        questions: parsedQuestions.map(question => formatQuestionForVerification(question)),
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileMimeType: req.file.mimetype,
          processedAt: new Date().toISOString(),
          userId: req.user.id,
          ocrMetadata: ocrResult.metadata,
          enhancedProcessing: true
        },
        rawText: process.env.NODE_ENV === 'development' ? ocrResult.text : undefined
      }
    });
  } catch (error) {
    console.error('Enhanced OCR upload error:', error);
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    safeRespond(500, {
      success: false,
      message: 'Failed to process image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  uploadImage
};