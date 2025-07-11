import { createWorker } from 'tesseract.js';

export class OCRService {
  constructor() {
    this.worker = null;
    this.initializeWorker();
  }

  async initializeWorker() {
    try {
      this.worker = await createWorker({
        logger: (m) => console.log(m),
      });
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
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
    // Basic text processing to clean up OCR output
    const cleanedText = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    return {
      rawText: text,
      cleanedText,
      questions: this.extractQuestions(cleanedText)
    };
  }

  extractQuestions(text) {
    // Basic question extraction logic
    const questions = [];
    const lines = text.split('\n');

    lines.forEach(line => {
      // Simple regex to detect questions (can be improved)
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
