const OCRQuestionParser = require('./services/ocrService');

async function testOCR() {
  const testText = `1. What is the powerhouse of the cell?
A) Nucleus
B) Ribosome
C) Mitochondria
D) Endoplasmic Reticulum

2. What is H2O?
(A) Salt
(B) Water
(C) Acid

3. Which planet is closest to the Sun?
A. Mercury
B. Venus
C. Earth
D. Mars`;

  console.log('Testing OCR Question Parser...\n');

  try {
    const parser = new OCRQuestionParser();
    const result = parser.parseQuestionsFromText(testText);

    console.log('Parsed Questions:');
    console.log(JSON.stringify(result, null, 2));

    const validation = parser.validateQuestions(result);
    console.log('\nValidation Result:');
    console.log(`Valid Questions: ${validation.validCount}/${validation.totalProcessed}`);

    if (validation.errors.length > 0) {
      console.log('Errors:', validation.errors);
    }

    console.log('\n✅ OCR Service test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing OCR service:', error.message);
  }
}

testOCR();
