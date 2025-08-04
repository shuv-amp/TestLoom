const express = require('express');
const router = express.Router();
const ocrTestingService = require('../services/ocrTestingService');
const multer = require('multer');
const path = require('path');

// Configure multer for test image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        cb(null, `test-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, BMP, and TIFF are allowed.'));
        }
    }
});

/**
 * GET /api/test/health
 * Comprehensive health check for all OCR services
 */
router.get('/health', async (req, res) => {
    try {
        const healthResult = await ocrTestingService.performHealthCheck();

        const statusCode = healthResult.overall === 'healthy' ? 200 :
            healthResult.overall === 'degraded' ? 206 : 503;

        res.status(statusCode).json({
            success: healthResult.overall !== 'unhealthy',
            data: healthResult
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message
        });
    }
});

/**
 * POST /api/test/ocr-pipeline
 * Test the complete OCR pipeline with uploaded image
 */
router.post('/ocr-pipeline', upload.single('testImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No test image uploaded'
            });
        }

        const fs = require('fs').promises;
        const imageBuffer = await fs.readFile(req.file.path);

        const testOptions = {
            subject: req.body.subject,
            expectedQuestionCount: req.body.expectedQuestionCount ? parseInt(req.body.expectedQuestionCount) : undefined
        };

        const testResult = await ocrTestingService.testOCRPipeline(imageBuffer, testOptions);

        // Clean up uploaded file
        await fs.unlink(req.file.path);

        res.json({
            success: testResult.success,
            message: 'OCR pipeline test completed',
            data: testResult
        });

    } catch (error) {
        // Clean up uploaded file if exists
        if (req.file && req.file.path) {
            try {
                const fs = require('fs').promises;
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up test file:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'OCR pipeline test failed',
            error: error.message
        });
    }
});

/**
 * POST /api/test/benchmark
 * Run benchmark tests with multiple images
 */
router.post('/benchmark', upload.array('testImages', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No test images uploaded'
            });
        }

        const fs = require('fs').promises;
        const testImages = [];

        // Prepare test images
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const buffer = await fs.readFile(file.path);

            testImages.push({
                name: file.originalname,
                buffer: buffer,
                subject: req.body[`subject_${i}`] || 'general',
                expectedCount: req.body[`expectedCount_${i}`] ? parseInt(req.body[`expectedCount_${i}`]) : undefined
            });
        }

        const benchmarkResult = await ocrTestingService.runBenchmark(testImages);

        // Clean up uploaded files
        for (const file of req.files) {
            try {
                await fs.unlink(file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up benchmark file:', cleanupError);
            }
        }

        res.json({
            success: true,
            message: 'Benchmark completed',
            data: benchmarkResult
        });

    } catch (error) {
        // Clean up uploaded files if they exist
        if (req.files) {
            const fs = require('fs').promises;
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (cleanupError) {
                    console.error('Error cleaning up benchmark file:', cleanupError);
                }
            }
        }

        res.status(500).json({
            success: false,
            message: 'Benchmark failed',
            error: error.message
        });
    }
});

/**
 * GET /api/test/history
 * Get test history and statistics
 */
router.get('/history', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const history = ocrTestingService.getTestHistory(limit);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get test history',
            error: error.message
        });
    }
});

/**
 * POST /api/test/validate-accuracy
 * Validate OCR accuracy against known text
 */
router.post('/validate-accuracy', async (req, res) => {
    try {
        const { extractedText, expectedText } = req.body;

        if (!extractedText || !expectedText) {
            return res.status(400).json({
                success: false,
                message: 'Both extractedText and expectedText are required'
            });
        }

        const accuracy = ocrTestingService.validateOCRAccuracy(extractedText, expectedText);

        res.json({
            success: true,
            data: accuracy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Accuracy validation failed',
            error: error.message
        });
    }
});

module.exports = router;