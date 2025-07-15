# 📷 TestLoom OCR Implementation

## Overview

This document describes the complete OCR (Optical Character Recognition) implementation for TestLoom, which allows users to upload images of exam papers and automatically extract, parse, and structure questions.

## 🏗️ Architecture

```
                               ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
                               │   Frontend      │───▶│   OCR Service    │───▶│   Database      │
                               │  (File Upload)  │    │  (Tesseract.js)  │    │   (MongoDB)     │
                               └─────────────────┘    └──────────────────┘    └─────────────────┘
                                                               │
                                                               ▼
                                                       ┌──────────────────┐
                                                       │ Question Parser  │
                                                       │ (Pattern Match)  │
                                                       └──────────────────┘
```

## 📁 File Structure

```
packages/backend/src/
├── controllers/
│   ├── ocrController.js         # OCR upload & processing
│   └── questionController.js    # Question CRUD operations
├── models/
│   └── questionModel.js         # MongoDB question schema
├── routes/
│   ├── ocrRoutes.js            # OCR API endpoints
│   └── questionRoutes.js       # Question API endpoints
├── services/
│   ├── ocrService.js           # Core OCR processing logic
│   └── questionService.js      # Question utilities & analytics
└── db/
    ├── init.js                 # Database initialization
    ├── migrations/
    │   └── createQuestionIndexes.js
    └── seeds/
        └── sampleQuestions.js
```

## 🔧 Implementation Details

### 1. OCR Service (`src/services/ocrService.js`)

**Core Features:**
- Text extraction using Tesseract.js
- Advanced question parsing with regex patterns
- Support for MCQ, Fill-in-the-blank, and Descriptive questions
- Confidence scoring and duplicate detection
- Text cleaning and normalization

**Key Methods:**
```javascript
extractTextFromImage(imageBuffer)    // Extract raw text from image
parseQuestions(rawText)              // Parse structured questions
parseQuestionContent(content, id)    // Identify question types
calculateConfidence(content, options) // Quality assessment
```

### 2. Question Model (`src/models/questionModel.js`)

**Schema Features:**
- Flexible question types (MCQ, FIB, DESCRIPTIVE)
- Embedded options and blanks
- Subject/chapter categorization
- OCR metadata tracking
- Verification workflow support

**Validation:**
- MCQ must have 2-5 options with exactly one correct answer
- FIB must have at least one blank
- Required metadata (subject, created by)

### 3. API Endpoints

#### OCR Processing
- `POST /api/ocr/upload` - Upload and process image
- File validation (type, size)
- Automatic cleanup after processing

#### Question Management
- `POST /api/questions/finalize` - Save verified questions
- `GET /api/questions` - Retrieve with filtering/pagination
- `GET /api/questions/statistics` - Analytics dashboard
- `GET /api/questions/search` - Text-based search
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Remove question

## 🚀 Getting Started

### Prerequisites
```bash
# Required dependencies already installed:
# - tesseract.js (OCR engine)
# - multer (file uploads)
# - mongoose (MongoDB ODM)
```

### Database Setup
```bash
# Initialize database with indexes and sample data
npm run db:init

# Or run separately:
npm run db:indexes  # Create performance indexes
npm run seed       # Add sample questions
```

### Usage Example

#### 1. Upload Image for OCR
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/ocr/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
// result.data.questions contains parsed questions for review
```

#### 2. Finalize Verified Questions
```javascript
const payload = {
  questions: [
    {
      questionText: "What is the capital of Nepal?",
      questionType: "MCQ",
      options: [
        { label: "A", text: "Kathmandu", isCorrect: true },
        { label: "B", text: "Pokhara", isCorrect: false }
      ],
      confidence: 0.9
    }
  ],
  metadata: {
    subject: "Geography",
    chapter: "Asian Countries",
    semester: "First"
  }
};

const response = await fetch('/api/questions/finalize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

## 🧠 Question Parsing Logic

### Pattern Recognition
The parser uses multiple strategies to identify questions:

1. **Numbered Questions**: `1.`, `Q1.`, `Question 1:`
2. **MCQ Detection**: Options labeled A-E with various formats
3. **Fill-in-the-blank**: `_____`, `[...]`, `(...)`
4. **Answer Detection**: Keywords like "Answer: A"

### Confidence Scoring
```javascript
// Factors affecting confidence:
- Number of options (MCQ): +0.2 for ≥3 options
- Question indicators: +0.1 for question words/marks
- Detected answers: +0.1 for found correct answers
- Pattern consistency: +0.1 for clear formatting
```

### Quality Assurance
- Duplicate detection using Levenshtein distance
- Minimum text length requirements
- Format validation before database insertion

## 📊 Database Schema

### Question Document
```javascript
{
  _id: ObjectId,
  questionText: String,        // Main question content
  questionType: "MCQ|FIB|DESCRIPTIVE",
  
  // MCQ specific
  options: [{
    label: "A|B|C|D|E",
    text: String,
    isCorrect: Boolean
  }],
  
  // FIB specific  
  blanks: [{
    position: Number,
    answer: String,
    placeholder: String
  }],
  
  // Metadata
  subject: String,
  chapter: String,
  semester: String,
  difficulty: "easy|medium|hard",
  tags: [String],
  
  // Tracking
  createdBy: ObjectId,
  isVerified: Boolean,
  source: "ocr|manual|import",
  
  // OCR specific
  ocrMetadata: {
    originalFileName: String,
    confidence: Number,
    processedAt: Date
  },
  
  timestamps: { createdAt, updatedAt }
}
```

### Database Indexes
```javascript
// Performance indexes
{ subject: 1, chapter: 1, questionType: 1 }
{ createdBy: 1, createdAt: -1 }
{ tags: 1 }
{ isVerified: 1 }
{ 'ocrMetadata.confidence': -1 }
```

## 🔒 Security & Validation

### File Upload Security
- Type validation (JPEG, PNG, BMP, TIFF only)
- Size limits (10MB maximum)
- Automatic file cleanup after processing
- No file storage on server

### Authentication
- JWT required for all endpoints
- User-based question ownership
- Admin role for global access

### Input Validation
- Zod schemas for request validation
- MongoDB schema validation
- XSS protection through input sanitization

## 📈 Performance Optimizations

### OCR Processing
- Single Tesseract worker instance (reused)
- Progress logging for long-running operations
- Error handling with graceful fallbacks

### Database
- Compound indexes for common query patterns
- Pagination for large result sets
- Aggregation pipelines for analytics

### API Design
- RESTful endpoints with clear semantics
- Structured error responses
- Comprehensive logging

## 🧪 Testing Strategy

### Unit Tests (Recommended)
```javascript
// OCR Service
describe('OCR Service', () => {
  test('should extract text from valid image');
  test('should parse MCQ questions correctly');
  test('should handle malformed input gracefully');
});

// Question Controller  
describe('Question Controller', () => {
  test('should save valid questions');
  test('should reject invalid question data');
  test('should enforce user permissions');
});
```

### Integration Tests
- File upload workflows
- Database persistence
- Authentication flows

## 🚨 Error Handling

### OCR Errors
- Image processing failures
- Text extraction timeouts
- Pattern matching failures

### Database Errors
- Validation failures
- Duplicate detection
- Connection issues

### File Upload Errors
- Invalid file types
- Size limit exceeded
- Missing files

## 📚 Usage Examples

### Complete Workflow
```javascript
// 1. User uploads exam paper image
// 2. OCR processes and returns structured data
// 3. User reviews and edits questions in UI
// 4. Frontend sends verified data to finalize endpoint
// 5. Questions saved to database with metadata
// 6. Available for quiz generation and practice
```
