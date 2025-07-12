const { createWorker } = require('tesseract.js');

class OCRService {
  constructor() {
    this.worker = null;
  }

  async initializeWorker() {
    try {
      this.worker = await createWorker();
      // worker.load() is deprecated and not needed
    } catch (error) {
      throw error;
    }
  }

  async processImage(file) {
    try {
      if (!this.worker) {
        await this.initializeWorker();
      }
      const imageBase64 = `data:image/png;base64,${file.toString('base64')}`;
      const { data: { text, confidence } } = await this.worker.recognize(imageBase64, 'eng');
      return this.processText(text, confidence);
    } catch (error) {
      throw error;
    }
  }

  processText(text, confidence = 75) {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    return {
      rawText: text,
      cleanedText,
      questions: this.extractQuestions(text, confidence)
    };
  }

  extractQuestions(text, confidence = 75) {
    const results = [];
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    let number = 1;
    const extractedAt = new Date().toISOString();
    for (let i = 0; i < lines.length; i++) {
      if (/^Q\./i.test(lines[i])) {
        const questionText = lines[i].replace(/^Q\.\s*/, '').replace(/\?$/, '').trim() + '?';
        let options = { a: null, b: null, c: null, d: null };
        let optionLines = [];
        for (let j = i + 1; j < lines.length && !/^Q\./i.test(lines[j]); j++) {
          // Split lines with multiple options into separate lines
          const splitOpts = lines[j].split(/(?=[a-dA-D]\))/).map(s => s.trim()).filter(s => s);
          optionLines.push(...splitOpts);
        }
        // Extract each option from its own line
        optionLines.forEach(line => {
          const optMatch = line.match(/^([a-dA-D])\)\s*(.*)$/);
          if (optMatch) {
            options[optMatch[1].toLowerCase()] = optMatch[2].trim();
          }
        });
        if (questionText && (options.a || options.b || options.c || options.d)) {
          results.push({
            number,
            text: questionText,
            options,
            type: 'text',
            confidence,
            extracted_at: extractedAt
          });
          number++;
        }
      }
    }
    return results;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }
}

module.exports = { OCRService };
