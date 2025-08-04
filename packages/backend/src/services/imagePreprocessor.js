const sharp = require('sharp');

class UltraImagePreprocessor {
    constructor() {
        this.logger = console;
        this.processingVariants = [
            'standard',
            'high_contrast',
            'denoised',
            'sharpened',
            'gaussian_blur',
            'unsharp_mask'
        ];
    }

    /**
     * Ultra preprocessing pipeline with Sharp
     * @param {Buffer} imageBuffer - Input image buffer
     * @param {Object} options - Preprocessing options
     * @returns {Object} - All processed variants with quality scores
     */
    async ultraPreprocessForOCR(imageBuffer, options = {}) {
        try {
            const startTime = Date.now();
            this.logger.info('Starting ultra image preprocessing pipeline (Sharp only)');
            const variants = {};
            for (const variantName of this.processingVariants) {
                try {
                    const processedBuffer = await this.processVariant(imageBuffer, variantName);
                    if (processedBuffer && Buffer.isBuffer(processedBuffer)) {
                        variants[variantName] = {
                            buffer: processedBuffer,
                            quality: await this.assessImageQuality(processedBuffer),
                            method: variantName
                        };
                        this.logger.debug(`Variant ${variantName} processed with quality: ${variants[variantName].quality}`);
                    } else {
                        this.logger.warn(`Variant ${variantName} returned invalid buffer, skipping.`);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to process variant ${variantName}:`, error?.message || error);
                }
            }
            // Rank variants by quality score
            const rankedVariants = Object.entries(variants)
                .sort(([, a], [, b]) => b.quality - a.quality)
                .reduce((obj, [key, value]) => { obj[key] = value; return obj; }, {});
            const processingTime = Date.now() - startTime;
            this.logger.info(`Ultra preprocessing completed in ${processingTime}ms, generated ${Object.keys(variants).length} variants`);
            return {
                variants: rankedVariants,
                processingTime,
                bestVariant: Object.keys(rankedVariants)[0]
            };
        } catch (error) {
            this.logger.error('Ultra preprocessing failed:', error?.message || error);
            return await this.fallbackPreprocessing(imageBuffer);
        }
    }

    /**
     * Process specific variant with Sharp
     */
    async processVariant(imageBuffer, variantName) {
        switch (variantName) {
            case 'standard':
                return await this.standardProcessing(imageBuffer);
            case 'high_contrast':
                return await this.highContrastProcessing(imageBuffer);
            case 'denoised':
                return await this.denoisedProcessing(imageBuffer);
            case 'sharpened':
                return await this.sharpenedProcessing(imageBuffer);
            case 'gaussian_blur':
                return await this.gaussianBlurProcessing(imageBuffer);
            case 'unsharp_mask':
                return await this.unsharpMaskProcessing(imageBuffer);
            default:
                return imageBuffer;
        }
    }

    async standardProcessing(imageBuffer) {
        // Basic grayscale and threshold
        return await sharp(imageBuffer)
            .greyscale()
            .threshold(128)
            .toBuffer();
    }

    async highContrastProcessing(imageBuffer) {
        // Increase contrast and apply threshold
        return await sharp(imageBuffer)
            .greyscale()
            .linear(1.5, -50)
            .threshold(100)
            .toBuffer();
    }

    async denoisedProcessing(imageBuffer) {
        // Use Sharp for denoising (mild blur)
        return await sharp(imageBuffer)
            .greyscale()
            .blur(1)
            .toBuffer();
    }

    async sharpenedProcessing(imageBuffer) {
        // Use Sharp for sharpening
        return await sharp(imageBuffer)
            .sharpen()
            .toBuffer();
    }

    async gaussianBlurProcessing(imageBuffer, sigma = 2) {
        // Use Sharp for gaussian blur
        // Clamp sigma to valid range [0.3, 1000]
        const safeSigma = Math.max(0.3, Math.min(sigma, 1000));
        return await sharp(imageBuffer)
            .greyscale()
            .blur(safeSigma)
            .toBuffer();
    }

    async unsharpMaskProcessing(imageBuffer, sigma = 0.5) {
        // Use Sharp for unsharp mask (sharpen + blur)
        // Clamp sigma to valid range [0.3, 1000]
        const safeSigma = Math.max(0.3, Math.min(sigma, 1000));
        return await sharp(imageBuffer)
            .sharpen({ sigma: 1 })
            .blur(safeSigma)
            .toBuffer();
    }

    async assessImageQuality(imageBuffer) {
        // Dummy quality metric: use file size as proxy
        return imageBuffer.length;
    }

    async fallbackPreprocessing(imageBuffer) {
        // Simple grayscale fallback
        return {
            variants: {
                fallback: {
                    buffer: await sharp(imageBuffer).greyscale().toBuffer(),
                    quality: imageBuffer.length,
                    method: 'fallback'
                }
            },
            processingTime: 0,
            bestVariant: 'fallback'
        };
    }
}

module.exports = new UltraImagePreprocessor();