# 🏗️ TestLoom System Architecture

## 🎯 System Overview

```mermaid
graph TB
    subgraph "🎨 Presentation Layer"
        WEB[Web Application<br/>Nuxt.js + Vue.js<br/>Responsive UI]
        MOBILE[📱 Mobile App<br/>Future Enhancement]
    end

    subgraph "🚪 API Gateway Layer"
        GATEWAY[Express.js Router<br/>🔒 JWT Authentication (RS256)<br/>📊 Rate Limiting & CORS<br/>🛡️ Input Validation]
    end

    subgraph "⚙️ Application Services Layer"
        AUTH[🔐 Authentication Service<br/>JWT & Role Management<br/>Student/Admin/Moderator]
        QUIZ[🧠 Adaptive Quiz Engine<br/>MCQ & Fill-in-Blank<br/>Performance Analytics]
        OCR[📸 OCR Processing Service<br/>Tesseract.js + Google Vision API<br/>Image-to-Quiz Conversion]
        SOCIAL[💬 Real-time Communication<br/>Socket.IO Discussion Forums<br/>Collaborative Learning]
        CONTENT[📚 Content Management<br/>Question Categorization<br/>Subject/Chapter Organization]
    end

    subgraph "💾 Data Layer"
        MONGO[(🍃 MongoDB Primary<br/>Question Banks<br/>User Profiles<br/>Quiz Records)]
        REDIS[(⚡ Redis Cache<br/>Session Management<br/>Real-time Data)]
        FILES[(📁 File Storage<br/>Question Images<br/>OCR Processed Content)]
    end

    WEB --> GATEWAY
    MOBILE -.-> GATEWAY
    GATEWAY --> AUTH
    GATEWAY --> QUIZ
    GATEWAY --> OCR
    GATEWAY --> SOCIAL
    GATEWAY --> CONTENT

    AUTH --> MONGO
    AUTH --> REDIS
    QUIZ --> MONGO
    QUIZ --> REDIS
    OCR --> FILES
    OCR --> MONGO
    SOCIAL --> REDIS
    CONTENT --> MONGO
```

