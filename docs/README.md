# 📚 TestLoom Documentation

> **Academic Project for Kathmandu University**  
> *Department of Computer Science and Engineering*  
> **Code:** COMP 206 | **Semester:** II Year / I Semester Computer Engineering

Welcome to the comprehensive documentation for **TestLoom** - a centralized web-based platform designed to revolutionize university exam preparation through organized practice of multiple-choice and fill-in-the-blank questions.

## 🎯 Project Abstract

TestLoom resolves the problem of scattered and inconsistent exam preparation resources by providing a centralized web-based platform for university students to access, practice, and discuss questions in a structured and interactive manner. The platform aims to make examination revision easier and more effective while facilitating collaborative learning.

### 🔑 Key Features
- **📋 Centralized Question Bank** - MCQs and fill-in-the-blank questions organized by semester, subject, and chapter
- **📸 OCR Integration** - Upload physical question papers and convert them to quiz-ready formats using Tesseract.js or Google Vision API
- **🔐 Secure Authentication** - JWT-based authentication with role-based access control
- **💬 Real-time Collaboration** - Socket.IO powered discussion forums and peer interaction
- **⏱️ Adaptive Quizzes** - Timed practice sessions with adaptive difficulty based on performance
- **📊 Performance Analytics** - Personalized dashboards tracking quiz performance and learning progress

### 🛠️ Technology Stack
- **Frontend:** Nuxt.js with Vue.js for responsive, interactive design
- **Backend:** Node.js with Express.js for scalable server environment
- **Database:** MongoDB (NoSQL) for organized storage and quick access
- **Authentication:** JSON Web Tokens (JWT) with RS256 algorithm for secure access control
- **Real-time:** Socket.IO for live discussions and collaboration
- **OCR:** Tesseract.js (client-side processing) + Google Vision API (cloud processing) for image-to-text conversion

---

## 🎯 Quick Links

| Resource | Description |
|----------|-------------|
| [🏗️ Architecture Diagram](./architecture.md) | System architecture overview |
| [📱 User Flow](./diagrams/user-flow.md) | User interaction flowcharts |
| [🗄️ Database Schema](./database-schema.md) | MongoDB schema design |
| [📚 API Documentation](./api/) | Complete API reference |

---
