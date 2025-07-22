/**
 * OCR Performance Monitoring Service
 * Tracks and analyzes OCR pipeline performance metrics
 */
class OCRPerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        inProgress: 0
      },
      timing: {
        preprocessing: [],
        ocr: [],
        postprocessing: [],
        total: []
      },
      quality: {
        averageConfidence: 0,
        confidenceHistory: [],
        imageQualityHistory: [],
        questionsExtracted: []
      },
      errors: {
        preprocessingErrors: 0,
        ocrErrors: 0,
        postprocessingErrors: 0,
        validationErrors: 0,
        errorLog: []
      },
      resources: {
        memoryUsage: [],
        cpuUsage: [],
        workerPoolUtilization: []
      }
    };
    
    this.sessionStartTime = Date.now();
    this.maxHistorySize = 1000; // Maximum number of historical records to keep
    this.reportingInterval = 5 * 60 * 1000; // 5 minutes
    this.performanceThresholds = {
      maxProcessingTime: 30000, // 30 seconds
      minConfidence: 0.5,
      maxErrorRate: 0.05, // 5%
      maxMemoryUsage: 500 * 1024 * 1024 // 500MB
    };
    
    this.alerts = [];
    this.isMonitoring = false;
    
    // Start monitoring if in production
    if (process.env.NODE_ENV === 'production') {
      this.startMonitoring();
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('OCR Performance Monitoring started');
    
    // Periodic performance reporting
    this.reportingIntervalId = setInterval(() => {
      this.generatePerformanceReport();
    }, this.reportingInterval);
    
    // Resource monitoring
    this.resourceMonitoringId = setInterval(() => {
      this.collectResourceMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('OCR Performance Monitoring stopped');
    
    if (this.reportingIntervalId) {
      clearInterval(this.reportingIntervalId);
    }
    
    if (this.resourceMonitoringId) {
      clearInterval(this.resourceMonitoringId);
    }
  }

  /**
   * Record start of OCR processing
   */
  recordProcessingStart(requestId, metadata = {}) {
    this.metrics.requests.total++;
    this.metrics.requests.inProgress++;
    
    return {
      requestId: requestId || this.generateRequestId(),
      startTime: Date.now(),
      metadata: metadata
    };
  }

  /**
   * Record completion of OCR processing
   */
  recordProcessingComplete(session, result) {
    const endTime = Date.now();
    const totalTime = endTime - session.startTime;
    
    this.metrics.requests.inProgress--;
    
    if (result.success) {
      this.metrics.requests.successful++;
      this.recordSuccessfulProcessing(session, result, totalTime);
    } else {
      this.metrics.requests.failed++;
      this.recordFailedProcessing(session, result, totalTime);
    }
    
    // Check for performance alerts
    this.checkPerformanceThresholds(totalTime, result);
  }

  /**
   * Record successful processing metrics
   */
  recordSuccessfulProcessing(session, result, totalTime) {
    // Record timing metrics
    if (result.timing) {
      this.addToHistory(this.metrics.timing.preprocessing, result.timing.preprocessing);
      this.addToHistory(this.metrics.timing.ocr, result.timing.ocr);
      this.addToHistory(this.metrics.timing.postprocessing, result.timing.postprocessing);
    }
    
    this.addToHistory(this.metrics.timing.total, totalTime);
    
    // Record quality metrics
    if (result.confidence !== undefined) {
      this.addToHistory(this.metrics.quality.confidenceHistory, result.confidence);
      this.updateAverageConfidence(result.confidence);
    }
    
    if (result.imageQuality !== undefined) {
      this.addToHistory(this.metrics.quality.imageQualityHistory, result.imageQuality);
    }
    
    if (result.questionsFound !== undefined) {
      this.addToHistory(this.metrics.quality.questionsExtracted, result.questionsFound);
    }
  }

  /**
   * Record failed processing metrics
   */
  recordFailedProcessing(session, result, totalTime) {
    const error = {
      timestamp: Date.now(),
      requestId: session.requestId,
      error: result.error,
      message: result.message,
      processingTime: totalTime,
      stage: result.failureStage || 'unknown'
    };
    
    // Categorize error
    switch (result.failureStage) {
      case 'preprocessing':
        this.metrics.errors.preprocessingErrors++;
        break;
      case 'ocr':
        this.metrics.errors.ocrErrors++;
        break;
      case 'postprocessing':
        this.metrics.errors.postprocessingErrors++;
        break;
      case 'validation':
        this.metrics.errors.validationErrors++;
        break;
    }
    
    this.addToHistory(this.metrics.errors.errorLog, error);
  }

  /**
   * Record preprocessing metrics
   */
  recordPreprocessingMetrics(duration, imageInfo) {
    this.addToHistory(this.metrics.timing.preprocessing, duration);
    
    if (imageInfo && imageInfo.qualityScore !== undefined) {
      this.addToHistory(this.metrics.quality.imageQualityHistory, imageInfo.qualityScore);
    }
  }

  /**
   * Record OCR metrics
   */
  recordOCRMetrics(duration, confidence, workerInfo) {
    this.addToHistory(this.metrics.timing.ocr, duration);
    
    if (confidence !== undefined) {
      this.addToHistory(this.metrics.quality.confidenceHistory, confidence);
    }
    
    if (workerInfo && workerInfo.utilization !== undefined) {
      this.addToHistory(this.metrics.resources.workerPoolUtilization, workerInfo.utilization);
    }
  }

  /**
   * Record post-processing metrics
   */
  recordPostProcessingMetrics(duration, qualityMetrics) {
    this.addToHistory(this.metrics.timing.postprocessing, duration);
    
    if (qualityMetrics) {
      if (qualityMetrics.overallScore !== undefined) {
        this.addToHistory(this.metrics.quality.confidenceHistory, qualityMetrics.overallScore);
      }
    }
  }

  /**
   * Collect system resource metrics
   */
  collectResourceMetrics() {
    try {
      const memUsage = process.memoryUsage();
      this.addToHistory(this.metrics.resources.memoryUsage, memUsage.heapUsed);
      
      // CPU usage would require additional libraries
      // For now, we'll just track memory
      
      // Check memory threshold
      if (memUsage.heapUsed > this.performanceThresholds.maxMemoryUsage) {
        this.addAlert('high_memory_usage', `Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }
    } catch (error) {
      console.warn('Failed to collect resource metrics:', error.message);
    }
  }

  /**
   * Check performance thresholds and generate alerts
   */
  checkPerformanceThresholds(processingTime, result) {
    // Check processing time
    if (processingTime > this.performanceThresholds.maxProcessingTime) {
      this.addAlert('slow_processing', `Processing took ${processingTime}ms`);
    }
    
    // Check confidence
    if (result.confidence !== undefined && result.confidence < this.performanceThresholds.minConfidence) {
      this.addAlert('low_confidence', `Confidence: ${result.confidence}`);
    }
    
    // Check error rate
    const errorRate = this.getErrorRate();
    if (errorRate > this.performanceThresholds.maxErrorRate) {
      this.addAlert('high_error_rate', `Error rate: ${(errorRate * 100).toFixed(2)}%`);
    }
  }

  /**
   * Add performance alert
   */
  addAlert(type, message) {
    const alert = {
      type: type,
      message: message,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error(`OCR Performance Alert [${type}]: ${message}`);
    } else if (alert.severity === 'warning') {
      console.warn(`OCR Performance Alert [${type}]: ${message}`);
    }
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(type) {
    const severityMap = {
      slow_processing: 'warning',
      low_confidence: 'warning',
      high_error_rate: 'critical',
      high_memory_usage: 'critical',
      worker_pool_exhausted: 'critical'
    };
    
    return severityMap[type] || 'info';
  }

  /**
   * Add value to history array with size limit
   */
  addToHistory(historyArray, value) {
    historyArray.push(value);
    
    if (historyArray.length > this.maxHistorySize) {
      historyArray.shift(); // Remove oldest entry
    }
  }

  /**
   * Update average confidence
   */
  updateAverageConfidence(newConfidence) {
    const history = this.metrics.quality.confidenceHistory;
    if (history.length === 0) {
      this.metrics.quality.averageConfidence = newConfidence;
    } else {
      const sum = history.reduce((acc, val) => acc + val, 0);
      this.metrics.quality.averageConfidence = sum / history.length;
    }
  }

  /**
   * Calculate current error rate
   */
  getErrorRate() {
    const total = this.metrics.requests.total;
    if (total === 0) return 0;
    
    return this.metrics.requests.failed / total;
  }

  /**
   * Calculate average processing time
   */
  getAverageProcessingTime() {
    const times = this.metrics.timing.total;
    if (times.length === 0) return 0;
    
    return times.reduce((acc, val) => acc + val, 0) / times.length;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const now = Date.now();
    const uptimeMs = now - this.sessionStartTime;
    
    return {
      uptime: {
        milliseconds: uptimeMs,
        seconds: Math.floor(uptimeMs / 1000),
        minutes: Math.floor(uptimeMs / 60000),
        hours: Math.floor(uptimeMs / 3600000)
      },
      requests: {
        ...this.metrics.requests,
        successRate: this.metrics.requests.total > 0 
          ? this.metrics.requests.successful / this.metrics.requests.total 
          : 0,
        errorRate: this.getErrorRate(),
        requestsPerMinute: this.metrics.requests.total / Math.max(uptimeMs / 60000, 1)
      },
      performance: {
        averageProcessingTime: Math.round(this.getAverageProcessingTime()),
        averagePreprocessingTime: this.getAverage(this.metrics.timing.preprocessing),
        averageOCRTime: this.getAverage(this.metrics.timing.ocr),
        averagePostprocessingTime: this.getAverage(this.metrics.timing.postprocessing),
        processingTimeP95: this.getPercentile(this.metrics.timing.total, 95),
        processingTimeP99: this.getPercentile(this.metrics.timing.total, 99)
      },
      quality: {
        averageConfidence: Math.round(this.metrics.quality.averageConfidence * 100) / 100,
        averageImageQuality: this.getAverage(this.metrics.quality.imageQualityHistory),
        averageQuestionsExtracted: this.getAverage(this.metrics.quality.questionsExtracted),
        confidenceP95: this.getPercentile(this.metrics.quality.confidenceHistory, 95)
      },
      errors: {
        totalErrors: this.metrics.requests.failed,
        preprocessingErrors: this.metrics.errors.preprocessingErrors,
        ocrErrors: this.metrics.errors.ocrErrors,
        postprocessingErrors: this.metrics.errors.postprocessingErrors,
        validationErrors: this.metrics.errors.validationErrors,
        recentErrors: this.metrics.errors.errorLog.slice(-10)
      },
      resources: {
        currentMemoryUsage: process.memoryUsage().heapUsed,
        averageMemoryUsage: this.getAverage(this.metrics.resources.memoryUsage),
        peakMemoryUsage: Math.max(...this.metrics.resources.memoryUsage, 0)
      },
      alerts: {
        totalAlerts: this.alerts.length,
        recentAlerts: this.alerts.slice(-10),
        criticalAlerts: this.alerts.filter(alert => alert.severity === 'critical').length
      }
    };
  }

  /**
   * Calculate average of array
   */
  getAverage(array) {
    if (array.length === 0) return 0;
    return Math.round(array.reduce((acc, val) => acc + val, 0) / array.length);
  }

  /**
   * Calculate percentile of array
   */
  getPercentile(array, percentile) {
    if (array.length === 0) return 0;
    
    const sorted = [...array].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
    return sorted[index] || 0;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const stats = this.getPerformanceStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: stats.requests.total,
        successRate: `${(stats.requests.successRate * 100).toFixed(2)}%`,
        averageProcessingTime: `${stats.performance.averageProcessingTime}ms`,
        averageConfidence: stats.quality.averageConfidence,
        memoryUsage: `${Math.round(stats.resources.currentMemoryUsage / 1024 / 1024)}MB`
      },
      performance: stats.performance,
      quality: stats.quality,
      alerts: stats.alerts.recentAlerts
    };
    
    // Log report in development/debug mode
    if (process.env.NODE_ENV === 'development' || process.env.OCR_DEBUG === 'true') {
      console.log('OCR Performance Report:', JSON.stringify(report, null, 2));
    }
    
    return report;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format = 'json') {
    const stats = this.getPerformanceStats();
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(stats, null, 2);
      
      case 'prometheus':
        return this.exportPrometheusMetrics(stats);
      
      case 'csv':
        return this.exportCSVMetrics(stats);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(stats) {
    const metrics = [];
    
    metrics.push(`# HELP ocr_requests_total Total number of OCR requests`);
    metrics.push(`# TYPE ocr_requests_total counter`);
    metrics.push(`ocr_requests_total ${stats.requests.total}`);
    
    metrics.push(`# HELP ocr_requests_successful Successful OCR requests`);
    metrics.push(`# TYPE ocr_requests_successful counter`);
    metrics.push(`ocr_requests_successful ${stats.requests.successful}`);
    
    metrics.push(`# HELP ocr_requests_failed Failed OCR requests`);
    metrics.push(`# TYPE ocr_requests_failed counter`);
    metrics.push(`ocr_requests_failed ${stats.requests.failed}`);
    
    metrics.push(`# HELP ocr_processing_time_ms Average processing time in milliseconds`);
    metrics.push(`# TYPE ocr_processing_time_ms gauge`);
    metrics.push(`ocr_processing_time_ms ${stats.performance.averageProcessingTime}`);
    
    metrics.push(`# HELP ocr_confidence_average Average OCR confidence score`);
    metrics.push(`# TYPE ocr_confidence_average gauge`);
    metrics.push(`ocr_confidence_average ${stats.quality.averageConfidence}`);
    
    metrics.push(`# HELP ocr_memory_usage_bytes Current memory usage in bytes`);
    metrics.push(`# TYPE ocr_memory_usage_bytes gauge`);
    metrics.push(`ocr_memory_usage_bytes ${stats.resources.currentMemoryUsage}`);
    
    return metrics.join('\n');
  }

  /**
   * Export metrics in CSV format
   */
  exportCSVMetrics(stats) {
    const csvLines = [];
    
    csvLines.push('metric,value,timestamp');
    csvLines.push(`total_requests,${stats.requests.total},${Date.now()}`);
    csvLines.push(`successful_requests,${stats.requests.successful},${Date.now()}`);
    csvLines.push(`failed_requests,${stats.requests.failed},${Date.now()}`);
    csvLines.push(`average_processing_time,${stats.performance.averageProcessingTime},${Date.now()}`);
    csvLines.push(`average_confidence,${stats.quality.averageConfidence},${Date.now()}`);
    csvLines.push(`memory_usage,${stats.resources.currentMemoryUsage},${Date.now()}`);
    
    return csvLines.join('\n');
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, inProgress: 0 },
      timing: { preprocessing: [], ocr: [], postprocessing: [], total: [] },
      quality: { averageConfidence: 0, confidenceHistory: [], imageQualityHistory: [], questionsExtracted: [] },
      errors: { preprocessingErrors: 0, ocrErrors: 0, postprocessingErrors: 0, validationErrors: 0, errorLog: [] },
      resources: { memoryUsage: [], cpuUsage: [], workerPoolUtilization: [] }
    };
    
    this.alerts = [];
    this.sessionStartTime = Date.now();
    
    console.log('OCR Performance metrics reset');
  }

  /**
   * Generate request ID
   */
  generateRequestId() {
    return `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new OCRPerformanceMonitor();
