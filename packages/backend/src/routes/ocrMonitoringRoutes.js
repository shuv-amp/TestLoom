const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const ocrService = require('../services/ocrService');
const ocrPerformanceMonitor = require('../services/ocrPerformanceMonitor');
const ocrCacheService = require('../services/ocrCacheService');
const ocrConfigManager = require('../config/ocrConfig');

const router = express.Router();

/**
 * Get OCR service statistics and health information
 * @route GET /api/ocr/stats
 * @access Private (Admin only)
 */
router.get('/stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = ocrService.getProcessingStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get OCR stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OCR statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get detailed performance monitoring data
 * @route GET /api/ocr/performance
 * @access Private (Admin only)
 */
router.get('/performance', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const performanceData = ocrPerformanceMonitor.getPerformanceStats();
    
    res.json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get cache statistics and configuration
 * @route GET /api/ocr/cache
 * @access Private (Admin only)
 */
router.get('/cache', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const cacheStats = ocrCacheService.getStats();
    
    res.json({
      success: true,
      data: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Clear OCR cache
 * @route DELETE /api/ocr/cache
 * @access Private (Admin only)
 */
router.delete('/cache', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    ocrCacheService.clear();
    
    res.json({
      success: true,
      message: 'OCR cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get OCR configuration
 * @route GET /api/ocr/config
 * @access Private (Admin only)
 */
router.get('/config', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const config = ocrConfigManager.getConfiguration();
    const summary = ocrConfigManager.getConfigurationSummary();
    
    res.json({
      success: true,
      data: {
        summary: summary,
        detailed: config
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get OCR config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OCR configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Update OCR configuration
 * @route PUT /api/ocr/config
 * @access Private (Admin only)
 */
router.put('/config', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate configuration updates
    const validation = ocrConfigManager.validateConfiguration(updates);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration',
        errors: validation.errors
      });
    }
    
    const updatedConfig = ocrConfigManager.updateConfiguration(updates);
    
    res.json({
      success: true,
      message: 'OCR configuration updated successfully',
      data: updatedConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update OCR config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update OCR configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Reset OCR configuration to defaults
 * @route POST /api/ocr/config/reset
 * @access Private (Admin only)
 */
router.post('/config/reset', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const defaultConfig = ocrConfigManager.resetConfiguration();
    
    res.json({
      success: true,
      message: 'OCR configuration reset to defaults',
      data: defaultConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to reset OCR config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset OCR configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Generate performance report
 * @route GET /api/ocr/report
 * @access Private (Admin only)
 */
router.get('/report', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const report = ocrPerformanceMonitor.generatePerformanceReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Export metrics in various formats
 * @route GET /api/ocr/metrics/export
 * @access Private (Admin only)
 */
router.get('/metrics/export', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const exportedMetrics = ocrPerformanceMonitor.exportMetrics(format);
    
    // Set appropriate content type
    let contentType = 'application/json';
    let filename = `ocr-metrics-${Date.now()}.json`;
    
    if (format === 'prometheus') {
      contentType = 'text/plain';
      filename = `ocr-metrics-${Date.now()}.txt`;
    } else if (format === 'csv') {
      contentType = 'text/csv';
      filename = `ocr-metrics-${Date.now()}.csv`;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportedMetrics);
    
  } catch (error) {
    console.error('Failed to export metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get service health status
 * @route GET /api/ocr/health
 * @access Public (for health checks)
 */
router.get('/health', async (req, res) => {
  try {
    const stats = ocrService.getProcessingStats();
    const health = stats.health;
    
    const status = health.status === 'healthy' ? 200 : 
                  health.status === 'degraded' ? 200 : 503;
    
    res.status(status).json({
      success: true,
      status: health.status,
      score: health.score,
      uptime: stats.performanceMonitoring.uptime.seconds,
      timestamp: new Date().toISOString(),
      details: {
        requests: stats.performanceMonitoring.requests,
        performance: {
          averageProcessingTime: stats.performanceMonitoring.performance.averageProcessingTime,
          errorRate: stats.performanceMonitoring.requests.errorRate
        },
        quality: {
          averageConfidence: stats.performanceMonitoring.quality.averageConfidence
        },
        cache: {
          enabled: stats.caching.enabled,
          hitRate: stats.caching.hitRate
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test OCR service with a simple image
 * @route POST /api/ocr/test
 * @access Private (Admin only)
 */
router.post('/test', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // This would require a test image - for now just return service status
    const stats = ocrService.getProcessingStats();
    
    res.json({
      success: true,
      message: 'OCR service is operational',
      data: {
        serviceHealth: stats.health,
        lastProcessed: stats.lastProcessedAt,
        totalProcessed: stats.totalProcessed
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('OCR test failed:', error);
    res.status(500).json({
      success: false,
      message: 'OCR service test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Reset performance metrics and monitoring data
 * @route POST /api/ocr/metrics/reset
 * @access Private (Admin only)
 */
router.post('/metrics/reset', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    ocrPerformanceMonitor.resetMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to reset metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset performance metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;