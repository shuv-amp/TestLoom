# 🔍 OCR Service Integration Guide

## Overview

TestLoom's OCR (Optical Character Recognition) service enables automatic text extraction from uploaded images, allowing users to generate quizzes from textbooks, handwritten notes, and other educational materials.

### Key Features
- **Multi-format Support**: JPG, PNG, TIFF, BMP, PDF, WEBP
- **Language Detection**: Support for English and Nepali languages
- **Text Preprocessing**: AI-powered image enhancement for better accuracy
- **Question Parsing**: Intelligent extraction of questions and answers using ML
- **Batch Processing**: Handle multiple images simultaneously
- **Quality Validation**: Confidence scoring for extracted text with human review
- **Dual OCR Engine**: Tesseract.js for offline processing + Google Vision API for enhanced accuracy

### OCR Engine Selection

**Tesseract.js (Client-side)**
- Used for: Privacy-sensitive content, offline processing, basic text extraction
- Best for: Simple question papers, printed text, when internet connectivity is limited
- Advantages: No data leaves user device, faster for simple content, no API costs

**Google Vision API (Cloud)**
- Used for: Complex layouts, handwritten text, mathematical formulas, batch processing
- Best for: Handwritten notes, complex formatting, high-accuracy requirements
- Advantages: Superior accuracy, handles complex content, supports multiple languages

### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File Upload   │───▶│  Image Processor │───▶│   OCR Engine    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Question Parser │◀───│  Text Validator  │◀───│ Text Extractor  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

