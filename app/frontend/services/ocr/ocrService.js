const { createWorker } = require('tesseract.js');

class OCRService {
  constructor() {
    this.worker = null;
  }

  async initializeWorker() {
    try {
      this.worker = await createWorker();
      await this.worker.initialize('eng'); // Only initialize, no load or loadLanguage
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw error;
    }
  }

  async processImage(file) {
    try {
      if (!this.worker) {
        await this.initializeWorker();
      }
      const { data: { text } } = await this.worker.recognize(file);
      return this.processText(text);
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw error;
    }
  }

  processText(text) {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    return {
      rawText: text,
      cleanedText,
      questions: this.extractQuestions(cleanedText)
    };
  }

  extractQuestions(text) {
    const questions = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.match(/^[0-9]+\.\s+/) || line.match(/^[A-Z]\.\s+/)) {
        questions.push(line.trim());
      }
    });
    return questions;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }
}

module.exports = { OCRService };
