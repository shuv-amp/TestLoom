const { createWorker, PSM, OEM } = require('tesseract.js');
const imagePreprocessor = require('./imagePreprocessor');

class EnhancedOCRService {
    constructor() {
        this.workers = new Map(); 
        this.maxWorkers = 3;
        this.logger = console;
        this.initializeWorkers();
    }

    async initializeWorkers() {
        try {
            for (let i = 0; i < this.maxWorkers; i++) {
                const worker = await this.createOptimizedWorker();
                this.workers.set(`worker_${i}`, {
                    worker,
                    busy: false,
                    lastUsed: Date.now()
                });
            }
            this.logger.info(`Initialized ${this.maxWorkers} OCR workers`);
        } catch (error) {
            this.logger.error('Failed to initialize OCR workers:', error);
            throw error;
        }
    }

    async createOptimizedWorker() {
        const worker = await createWorker('eng', OEM.LSTM_ONLY, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        // Optimal parameters for exam papers and educational content
        await worker.setParameters({
            // Page Segmentation Mode - Treat image as single text block
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,

            // OCR Engine Mode - Use LSTM (best accuracy)
            tessedit_ocr_engine_mode: OEM.LSTM_ONLY,

            // Character whitelist for educational content (including common symbols)
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()[]{}:;-_+=*/%$@#&"\'`~^<>|\\/ \n\t',

            // Preserve line breaks and formatting
            preserve_interword_spaces: '1',

            // Language model weights
            language_model_penalty_non_freq_dict_word: '0.1',
            language_model_penalty_non_dict_word: '0.15',

            // Improve accuracy for small text
            textord_min_linesize: '1.25',

            // Better handling of mixed fonts and sizes
            textord_heavy_nr: '10',

            // Noise reduction
            textord_noise_area_ratio: '0.7',

            // Better word detection
            textord_words_width_ile: '10',
            textord_words_veto_power: '5',

            // Character confidence threshold
            tessedit_reject_bad_qual_wds: '1',

            // Debug and quality settings for exam papers
            tessedit_enable_dict_correction: '1',
            tessedit_enable_bigram_correction: '1',

            // Specific for question papers with multiple choice
            classify_enable_learning: '0', // Disable learning for consistency
            classify_enable_adaptive_matcher: '1'
        });

        return worker;
    }

    async getAvailableWorker() {
        // Find an available worker
        for (const [id, workerInfo] of this.workers) {
            if (!workerInfo.busy) {
                workerInfo.busy = true;
                workerInfo.lastUsed = Date.now();
                return { id, worker: workerInfo.worker };
            }
        }

        // If no workers available, wait for one to become free
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                for (const [id, workerInfo] of this.workers) {
                    if (!workerInfo.busy) {
                        workerInfo.busy = true;
                        workerInfo.lastUsed = Date.now();
                        clearInterval(checkInterval);
                        resolve({ id, worker: workerInfo.worker });
                        return;
                    }
                }
            }, 100);
        });
    }

    releaseWorker(workerId) {
        if (this.workers.has(workerId)) {
            this.workers.get(workerId).busy = false;
        }
    }

    /**
     * Enhanced text extraction with multiple attempts and confidence scoring
     */
    async extractTextFromImage(imageBuffer, options = {}) {
        const startTime = Date.now();
        let workerId = null;

        try {
            // Validate image quality first
            const qualityCheck = await imagePreprocessor.validateImageQuality(imageBuffer);
            if (!qualityCheck.isValid) {
                this.logger.warn('Image quality issues detected:', qualityCheck.issues);
            }

            // Generate multiple image variants for better OCR success
            const variants = await imagePreprocessor.generateVariants(imageBuffer);

            const results = [];

            // Try OCR with different preprocessing variants
            for (const [variantName, variantBuffer] of Object.entries(variants)) {
                if (!variantBuffer) continue;

                try {
                    const { id, worker } = await this.getAvailableWorker();
                    workerId = id;

                    this.logger.info(`Attempting OCR with variant: ${variantName}`);

                    const ocrResult = await worker.recognize(variantBuffer, {
                        rectangle: options.rectangle || undefined
                    });

                    const confidence = this.calculateOverallConfidence(ocrResult.data);

                    results.push({
                        variant: variantName,
                        text: ocrResult.data.text,
                        confidence,
                        wordCount: ocrResult.data.words?.length || 0,
                        lines: ocrResult.data.lines || [],
                        processingTime: Date.now() - startTime
                    });

                    this.releaseWorker(workerId);
                    workerId = null;

                    // If we get a high-confidence result, we can stop early
                    if (confidence > 0.85) {
                        this.logger.info(`High confidence result achieved with ${variantName}: ${confidence}`);
                        break;
                    }

                } catch (error) {
                    this.logger.error(`OCR failed for variant ${variantName}:`, error);
                    if (workerId) {
                        this.releaseWorker(workerId);
                        workerId = null;
                    }
                }
            }

            if (results.length === 0) {
                throw new Error('All OCR attempts failed');
            }

            // Select the best result based on confidence and content analysis
            const bestResult = this.selectBestResult(results);

            this.logger.info(`OCR completed. Best result from ${bestResult.variant} with confidence ${bestResult.confidence}`);

            return {
                text: bestResult.text,
                confidence: bestResult.confidence,
                variant: bestResult.variant,
                wordCount: bestResult.wordCount,
                processingTime: Date.now() - startTime,
                allResults: results,
                qualityCheck
            };

        } catch (error) {
            if (workerId) {
                this.releaseWorker(workerId);
            }
            this.logger.error('OCR extraction error:', error);
            throw new Error(`OCR extraction failed: ${error.message}`);
        }
    }

    /**
     * Calculate overall confidence from Tesseract result
     */
    calculateOverallConfidence(data) {
        if (!data.words || data.words.length === 0) return 0;

        const wordConfidences = data.words
            .filter(word => word.confidence > 0)
            .map(word => word.confidence);

        if (wordConfidences.length === 0) return 0;

        // Use weighted average with penalty for low-confidence words
        const avgConfidence = wordConfidences.reduce((sum, conf) => sum + conf, 0) / wordConfidences.length;
        const lowConfidenceWords = wordConfidences.filter(conf => conf < 60).length;
        const penalty = (lowConfidenceWords / wordConfidences.length) * 0.3;

        return Math.max(0, (avgConfidence / 100) - penalty);
    }

    /**
     * Select the best OCR result from multiple variants
     */
    selectBestResult(results) {
        if (results.length === 1) return results[0];

        // Score each result based on multiple factors
        const scoredResults = results.map(result => {
            let score = result.confidence * 0.4; // 40% weight on confidence

            // Add points for reasonable word count
            if (result.wordCount > 10 && result.wordCount < 2000) {
                score += 0.2;
            }

            // Add points for presence of question indicators
            const questionIndicators = /\b(what|which|how|when|where|why|who|define|explain|describe|calculate|choose|select)\b/gi;
            const matches = (result.text.match(questionIndicators) || []).length;
            score += Math.min(matches * 0.05, 0.2); // Up to 20% bonus

            // Add points for proper punctuation and structure
            if (result.text.includes('?')) score += 0.1;
            if (result.text.match(/[a-d]\)/gi)) score += 0.1; // Multiple choice indicators

            // Penalty for too much noise (excessive special characters)
            const specialChars = (result.text.match(/[^a-zA-Z0-9\s.,!?()[\]]/g) || []).length;
            const textLength = result.text.length;
            if (textLength > 0) {
                const noiseRatio = specialChars / textLength;
                if (noiseRatio > 0.1) score -= noiseRatio * 0.3;
            }

            return { ...result, score };
        });

        // Return the highest scoring result
        scoredResults.sort((a, b) => b.score - a.score);
        return scoredResults[0];
    }

    /**
     * Extract text with specific regions (for targeted extraction)
     */
    async extractTextFromRegion(imageBuffer, rectangle) {
        return await this.extractTextFromImage(imageBuffer, { rectangle });
    }

    /**
     * Batch processing for multiple images
     */
    async batchExtractText(imageBuffers) {
        const results = [];
        const batchSize = this.maxWorkers;

        for (let i = 0; i < imageBuffers.length; i += batchSize) {
            const batch = imageBuffers.slice(i, i + batchSize);
            const batchPromises = batch.map(buffer => this.extractTextFromImage(buffer));

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);
            } catch (error) {
                this.logger.error(`Batch processing error for batch starting at index ${i}:`, error);
            }
        }

        return results;
    }

    /**
     * Health check for OCR service
     */
    async healthCheck() {
        try {
            // Create a simple test image with text
            const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

            const { id, worker } = await this.getAvailableWorker();
            const result = await worker.recognize(testBuffer);
            this.releaseWorker(id);

            return {
                status: 'healthy',
                workersAvailable: Array.from(this.workers.values()).filter(w => !w.busy).length,
                totalWorkers: this.workers.size
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Cleanup all workers
     */
    async cleanup() {
        const cleanupPromises = Array.from(this.workers.values()).map(
            workerInfo => workerInfo.worker.terminate()
        );

        await Promise.all(cleanupPromises);
        this.workers.clear();
        this.logger.info('All OCR workers terminated');
    }
}

module.exports = new EnhancedOCRService();