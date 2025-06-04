# 📝 Quizzes API

## Overview

The Quiz API provides comprehensive quiz management functionality including creation, participation, grading, and analytics for the TestLoom platform.

## Quiz Management Flow

```mermaid
sequenceDiagram
    participant Moderator
    participant Quiz Service
    participant OCR Service
    participant Database
    participant Student

    Moderator->>Quiz Service: Create quiz
    Quiz Service->>Database: Store quiz metadata
    Moderator->>OCR Service: Upload question images
    OCR Service->>Database: Extract and store questions
    Quiz Service->>Database: Link questions to quiz
    
    Student->>Quiz Service: Start quiz attempt
    Quiz Service->>Database: Create attempt record
    Student->>Quiz Service: Submit answers
    Quiz Service->>Database: Store responses
    Quiz Service->>Quiz Service: Calculate score
    Quiz Service->>Database: Update attempt with results
```