# <div align="center">📸 OCR & Document Intelligence</div>

<div align="center">

**Transform Physical Papers into Digital Learning**

*Converting handwritten notes and printed exams into interactive quiz experiences*

---

![OCR](https://img.shields.io/badge/OCR-Tesseract.js-4285F4?style=for-the-badge&logo=javascript&logoColor=white)
![Google Vision](https://img.shields.io/badge/Google-Vision%20API-4285F4?style=for-the-badge&logo=google&logoColor=white)
![AI Processing](https://img.shields.io/badge/AI-Processing-success?style=for-the-badge&logo=tensorflow&logoColor=white)

</div>

---

## 🌟 OCR Vision

TestLoom's **Optical Character Recognition** system revolutionizes how students digitize study materials. Upload any question paper, handwritten notes, or textbook pages and watch them transform into interactive, searchable quiz content.

### 🎯 **Why OCR Transforms Learning**

<table>
<tr>
<td width="33%" align="center">

### ⚡ **Instant Digitization**
Convert physical study materials to digital format in seconds, not hours

</td>
<td width="33%" align="center">

### 🎯 **Smart Recognition**
Advanced AI identifies questions, options, and answers automatically

</td>
<td width="33%" align="center">

### 📚 **Growing Library**
Every upload expands the question bank for the entire student community

</td>
</tr>
</table>

### 🧠 **Intelligent Processing Pipeline**

```mermaid
graph LR
    A[📸 Image Upload] --> B[🔍 Quality Check]
    B --> C[⚡ Pre-processing]
    C --> D[🤖 OCR Engine]
    D --> E[📝 Text Extraction]
    E --> F[🧠 AI Analysis]
    F --> G[❓ Question Detection]
    G --> H[✅ Validation]
    H --> I[💾 Database Storage]
    
    class A,B upload
    class C,D,E process
    class F,G,H ai
    class I storage
```

---

## 🔧 Dual OCR Engine System

<div align="center">

### 🎭 **Smart Engine Selection**

```mermaid
flowchart TD
    A[📸 Document Upload] --> B{🔍 Content Analysis}
    B -->|Simple Text| C[📱 Tesseract.js]
    B -->|Complex/Handwritten| D[☁️ Google Vision API]
    B -->|Mixed Content| E[🎯 Hybrid Processing]
    
    C --> F[⚡ Client-side Processing]
    D --> G[🌐 Cloud Processing]
    E --> H[🔄 Best-of-both]
    
    F --> I[📋 Text Results]
    G --> I
    H --> I
    
    I --> J[🧠 AI Question Parsing]
    J --> K[✅ Quality Validation]
    K --> L[💾 Quiz Database]

    class A,C,F simple
    class D,G complex
    class E,H hybrid
    class I,J,K,L result
```

</div>

### 🎪 **Engine Comparison**

<table>
<tr>
<td width="50%">

#### 📱 **Tesseract.js (Client-side)**

**🎯 Perfect for:**
- ✅ Printed textbooks & papers
- ✅ Privacy-sensitive content
- ✅ Offline processing
- ✅ Quick simple documents

**💡 Advantages:**
- 🔒 Complete privacy (no data upload)
- ⚡ Instant processing
- 💰 Zero API costs
- 🌐 Works offline

</td>
<td width="50%">

#### ☁️ **Google Vision API (Cloud)**

**🎯 Perfect for:**
- ✅ Handwritten notes
- ✅ Complex mathematical formulas
- ✅ Poor quality images
- ✅ Multi-language content

**💡 Advantages:**
- 🎯 Superior accuracy (98%+)
- 🧠 Advanced AI processing
- 📝 Handwriting recognition
- 🌍 Multi-language support

</td>
</tr>
</table>

---

## 📊 Quality Assurance System

### 🎯 **Confidence Scoring**

<div align="center">

```mermaid
pie title OCR Quality Distribution
    "High Confidence (90-100%)" : 65
    "Medium Confidence (70-89%)" : 25
    "Low Confidence (50-69%)" : 8
    "Requires Review (< 50%)" : 2
```

</div>

### 🔍 **Quality Metrics**

| 📊 **Confidence Level** | 🎯 **Accuracy Range** | 🔄 **Action Required** | ⏱️ **Review Time** |
|:------------------------|:----------------------|:----------------------|:-------------------|
| 🟢 **High (90-100%)** | Perfect recognition | ✅ Auto-approval | None |
| 🟡 **Medium (70-89%)** | Minor corrections needed | 👀 Quick review | 2-3 minutes |
| 🟠 **Low (50-69%)** | Significant edits required | ✏️ Manual editing | 5-8 minutes |
| 🔴 **Poor (< 50%)** | Complete re-processing | 🔄 Re-upload recommended | 10+ minutes |

### 🛡️ **Validation Pipeline**

```mermaid
sequenceDiagram
    participant User as 👤 Student
    participant OCR as 🔍 OCR Engine
    participant AI as 🧠 AI Validator
    participant Moderator as 👨‍🏫 Moderator
    participant Database as 💾 Database

    User->>OCR: Upload Question Paper
    OCR->>AI: Extract & Analyze Text
    AI->>AI: Generate Confidence Score
    
    alt High Confidence (90%+)
        AI->>Database: Auto-approve & Store
        Database-->>User: ✅ Questions Ready
    else Medium Confidence (70-89%)
        AI->>Moderator: Flag for Quick Review
        Moderator->>Database: Approve with Edits
        Database-->>User: ✅ Questions Ready
    else Low Confidence (<70%)
        AI->>User: Request Manual Review
        User->>Database: Submit Corrections
        Database-->>User: ✅ Questions Ready
    end
```

---

### 🔤 **Multi-Language Support**

```mermaid
mindmap
  root((🌍 Language Support))
    📝 English
      📖 Printed Text
      ✍️ Handwriting
      🔢 Mathematical
    🇳🇵 Nepali (Devanagari)
      📚 Academic Content
      ✏️ Notes
      🎯 Questions
    🔢 Mathematical Symbols
      ∫ Calculus
      Σ Summation
      √ Radicals
      π Greek Letters
```

---

## 🎨 Image Processing Pipeline

### 📸 **Pre-processing Enhancement**

<div align="center">

```mermaid
graph TB
    A[📸 Raw Image] --> B[🔍 Quality Check]
    B --> C[📐 Orientation Fix]
    C --> D[🎨 Contrast Enhancement]
    D --> E[🔧 Noise Reduction]
    E --> F[📏 Text Region Detection]
    F --> G[🎯 OCR Ready Image]
    
    subgraph "Image Enhancements"
        H[🌟 Brightness Adjustment]
        I[📊 Histogram Equalization]
        J[🔲 Perspective Correction]
        K[✂️ Border Removal]
    end
    
    B --> H
    D --> I
    C --> J
    E --> K
    
    class A,B,C,D,E,F,G process
    class H,I,J,K enhance
```

</div>

---

## 📈 Advanced Features

### 🤖 **AI-Powered Enhancements**

<table>
<tr>
<td width="50%">

#### 🧠 **Smart Question Parsing**
- ✅ Automatic question numbering
- ✅ Option detection (A, B, C, D)
- ✅ Answer key identification
- ✅ Difficulty level assessment

</td>
<td width="50%">

#### 📝 **Content Enhancement**
- ✅ Grammar correction suggestions
- ✅ Mathematical formula formatting
- ✅ Image diagram extraction
- ✅ Topic categorization

</td>
</tr>
</table>

### 🔄 **Batch Processing**

```mermaid
sequenceDiagram
    participant User as 👤 Student
    participant Upload as 📤 Upload Service
    participant Queue as 🔄 Processing Queue
    participant OCR as 🔍 OCR Engine
    participant Database as 💾 Database

    User->>Upload: Upload Multiple Files
    Upload->>Queue: Add to Batch Queue
    
    loop For Each Document
        Queue->>OCR: Process Document
        OCR->>Database: Store Results
        Database-->>User: Update Progress
    end
    
    Database-->>User: ✅ All Complete
```

---


