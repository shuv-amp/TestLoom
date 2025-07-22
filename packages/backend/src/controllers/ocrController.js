const ocrService = require('../services/ocrService');
const fs = require('fs').promises;

/**
 * Enhanced OCR Controller with comprehensive processing and validation
 */

const getQuestionTypeSummary = (questions) => {
  const summary = {};
  questions.forEach(q => {
    const type = q.questionType || 'UNKNOWN';
    summary[type] = (summary[type] || 0) + 1;
  });
  return summary;
};

const calculateOverallConfidence = (questions) => {
  if (questions.length === 0) return 0;
  const totalConfidence = questions.reduce((sum, q) => sum + (q.confidence || 0.5), 0);
  return Math.round((totalConfidence / questions.length) * 100) / 100;
};

const formatQuestionForVerification = (question) => {
  const baseQuestion = {
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType,
    confidence: question.confidence
  };

  // Add type-specific data
  if (question.questionType === 'MCQ' && question.options) {
    baseQuestion.options = Array.isArray(question.options) 
      ? question.options.map(opt => ({ 
          label: opt.label, 
          text: opt.text 
        })) 
      : [];
  } else if (question.questionType === 'FIB' && question.blanks) {
    baseQuestion.blanks = question.blanks;
    baseQuestion.blankCount = question.blankCount || question.blanks.length;
  }

  // Add quality indicators
  if (question.validation) {
    baseQuestion.qualityScore = question.validation.score;
    baseQuestion.issues = question.validation.issues;
    baseQuestion.suggestions = question.validation.suggestions;
  }

  return baseQuestion;
};

const uploadImage = async (req, res) => {
  const processingStartTime = Date.now();
  
  try {
    // Validation checks
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded',
        error: 'MISSING_FILE'
      });
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload JPEG, PNG, BMP, or TIFF images only.',
        error: 'INVALID_FILE_TYPE',
        allowedTypes: allowedMimes
      });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size allowed is 10MB.',
        error: 'FILE_TOO_LARGE',
        maxSize: maxSize,
        receivedSize: req.file.size
      });
    }

    console.log(`Processing image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Read image buffer
    const imageBuffer = await fs.readFile(req.file.path);
    
    // Enhanced OCR processing with comprehensive pipeline
    const ocrResult = await ocrService.extractTextFromImage(imageBuffer, {
      userId: req.user.userId,
      fileName: req.file.originalname,
      enhancedProcessing: true
    });
    
    // Parse questions from OCR result
    let parsedQuestions = [];
    
    if (ocrResult.structuredData && ocrResult.structuredData.length > 0) {
      // Use enhanced structured data if available
      parsedQuestions = ocrService.parseQuestions(ocrResult.text, ocrResult.structuredData);
    } else {
      // Fallback to text-based parsing
      parsedQuestions = ocrService.parseQuestions(ocrResult.text);
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    // Calculate processing metrics
    const totalProcessingTime = Date.now() - processingStartTime;
    
    // Get OCR service statistics
    const serviceStats = ocrService.getProcessingStats();

    // Build comprehensive response
    const response = {
      success: true,
      message: 'Image processed successfully with enhanced OCR pipeline',
      data: {
        summary: {
          totalQuestionsFound: parsedQuestions.length,
          questionTypes: getQuestionTypeSummary(parsedQuestions),
          confidence: calculateOverallConfidence(parsedQuestions),
          processingTime: totalProcessingTime,
          imageQuality: ocrResult.processingInfo?.imageQuality || 'unknown'
        },
        questions: parsedQuestions.map(question => formatQuestionForVerification(question)),
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileMimeType: req.file.mimetype,
          processedAt: new Date().toISOString(),
          userId: req.user.userId,
          processingVersion: '2.0-enhanced'
        },
        qualityMetrics: ocrResult.qualityMetrics || {
          overallScore: calculateOverallConfidence(parsedQuestions),
          textQuality: { score: 0.8 },
          structureQuality: { score: 0.8 }
        },
        performance: {
          totalProcessingTime,
          breakdown: ocrResult.processingInfo || {},
          serviceStats: {
            totalProcessed: serviceStats.totalProcessed,
            averageProcessingTime: serviceStats.averageProcessingTime,
            averageAccuracy: serviceStats.averageAccuracy
          }
        }
      }
    };

    // Include debug information in development
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        rawText: ocrResult.text,
        processingLog: ocrResult.processingInfo?.processingLog,
        enhancedFeatures: {
          imagePreprocessing: true,
          adaptiveConfiguration: true,
          advancedPostProcessing: true,
          qualityAssessment: true
        }
      };
    }

    console.log(`OCR processing completed successfully in ${totalProcessingTime}ms`);
    console.log(`Questions found: ${parsedQuestions.length}, Average confidence: ${response.data.summary.confidence}`);

    res.json(response);

  } catch (error) {
    console.error('Enhanced OCR processing error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    // Determine error type and appropriate response
    let errorResponse = {
      success: false,
      message: 'Failed to process image with enhanced OCR pipeline',
      error: 'OCR_PROCESSING_FAILED',
      processingTime: Date.now() - processingStartTime
    };

    // Specific error handling
    if (error.message.includes('Image preprocessing failed')) {
      errorResponse.error = 'IMAGE_PREPROCESSING_FAILED';
      errorResponse.message = 'Image preprocessing failed. Please ensure the image is clear and properly formatted.';
    } else if (error.message.includes('OCR processing failed')) {
      errorResponse.error = 'OCR_EXTRACTION_FAILED';
      errorResponse.message = 'OCR text extraction failed. Please try with a higher quality image.';
    } else if (error.message.includes('Post-processing failed')) {
      errorResponse.error = 'POST_PROCESSING_FAILED';
      errorResponse.message = 'Text post-processing failed. The extracted text may be of poor quality.';
    }

    // Include detailed error info in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        stack: error.stack,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }

    // Return appropriate HTTP status based on error type
    const statusCode = errorResponse.error.includes('PREPROCESSING') ? 422 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
};

module.exports = {
  uploadImage
};
