# <div align="center">📚 TestLoom</div>

<div align="center">

**Revolutionizing University Exam Preparation**

*A centralized, intelligent platform for collaborative learning*

---

[![University](https://img.shields.io/badge/University-Kathmandu%20University-blue?style=for-the-badge)](https://ku.edu.np)
[![Department](https://img.shields.io/badge/Department-Computer%20Science%20%26%20Engineering-green?style=for-the-badge)](#)
[![Course](https://img.shields.io/badge/Course-COMP%20206-orange?style=for-the-badge)](#)
[![Year](https://img.shields.io/badge/Year-II%2FI%20Computer%20Engineering-purple?style=for-the-badge)](#)

</div>

---

## 🌟 Vision

TestLoom transforms scattered exam preparation into a **unified, intelligent learning ecosystem** where students collaborate, practice, and excel together. No more hunting through fragmented resources—everything you need is here.

---

## ✨ Core Features
<div align="center">
<table>
<tr>
<td width="50%">

### 🎯 **Smart Question Bank**
- **Organized by semester, subject & chapter**
- Multiple-choice & fill-in-the-blank questions
- Difficulty-based categorization
- Crowd-sourced content expansion

</td>
<td width="50%">

### 🤖 **AI-Powered OCR**
- **Upload physical papers instantly**
- Tesseract.js + Google Vision API
- Automatic question extraction
- Format conversion to digital quizzes

</td>
</tr>
<tr>
<td width="50%">

### 🔒 **Enterprise Security**
- **JWT-based authentication (RS256)**
- Role-based access control
- Secure session management
- Data privacy compliance

</td>
<td width="50%">

### ⚡ **Real-Time Collaboration**
- **Socket.IO powered discussions**
- Live peer interactions
- Instant doubt resolution
- Community-driven learning

</td>
</tr>
<tr>
<td width="50%">

### 🧠 **Adaptive Intelligence**
- **Performance-based difficulty**
- Personalized learning paths
- Smart question recommendations
- Timed practice sessions

</td>
<td width="50%">

### 📊 **Analytics Dashboard**
- **Comprehensive progress tracking**
- Performance insights
- Strength/weakness analysis
- Achievement milestones

</td>
</tr>
</table>
</div>

---

## 🏗️ Architecture

<div align="center">

```mermaid
graph TB
    A[👤 Student] --> B[🌐 Nuxt.js Frontend]
    B --> C[🔗 Express.js API]
    C --> D[🗄️ MongoDB Database]
    C --> E[🔐 JWT Auth]
    C --> F[⚡ Socket.IO]
    C --> G[🤖 OCR Services]
    G --> H[📷 Tesseract.js]
    G --> I[☁️ Google Vision]
    
```

</div>

---

## 🛠️ Technology Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|------------|---------|
| **🎨 Frontend** | ![Nuxt.js](https://img.shields.io/badge/Nuxt.js-00DC82?style=flat-square&logo=nuxt.js&logoColor=white) ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&logo=vue.js&logoColor=white) | Responsive UI/UX |
| **⚙️ Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white) | Scalable API |
| **🗄️ Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) | NoSQL Storage |
| **🔐 Auth** | ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | Secure Access |
| **⚡ Real-time** | ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white) | Live Communication |
| **🤖 OCR** | ![Tesseract](https://img.shields.io/badge/Tesseract-4285F4?style=flat-square) ![Google Vision](https://img.shields.io/badge/Google%20Vision-4285F4?style=flat-square&logo=google&logoColor=white) | Image Processing |

</div>

---

## 🚀 Quick Navigation

<div align="center">


| 📋 **Documentation**                                                             | 📊 **Resources**                                                       |
| :------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| [🏗️ **Architecture Overview**](./architecture.md)<br>System design & components | [📚 **API Reference**](./api/)<br>Complete endpoint docs               |
| [👤 **User Flows**](./diagrams/user-flow.md)<br>Interaction diagrams             | [🗄️ **Database Schema**](./database-schema.md)<br>MongoDB collections |


</div>
