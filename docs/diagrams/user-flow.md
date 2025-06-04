# 📈 User Flow Diagrams

This document outlines the key user journeys and interaction flows within TestLoom.

## 🎯 Student Registration Flow

```mermaid
flowchart TD
    A[Visit TestLoom] --> B{Has Account?}
    B -->|No| C[Click Sign Up]
    B -->|Yes| D[Login]
    
    C --> E[Enter Details]
    E --> F[Submit Registration]
    F --> G[Email Verification]
    G --> H[Verify Email]
    H --> I[Complete Profile]
    I --> J[Dashboard]
    
    D --> K[Enter Credentials]
    K --> L{Valid?}
    L -->|Yes| J
    L -->|No| M[Show Error]
    M --> K
```

## 📚 Quiz Taking Flow

```mermaid
flowchart TD
    A[Dashboard] --> B[Browse Subjects]
    B --> C[Select Chapter]
    C --> D[Configure Quiz]
    D --> E[Start Quiz]
    
    E --> F[Question 1]
    F --> G[Answer Question]
    G --> H{More Questions?}
    H -->|Yes| I[Next Question]
    I --> F
    H -->|No| J[Submit Quiz]
    
    J --> K[Show Results]
    K --> L[View Analytics]
    L --> M[Return to Dashboard]
    
```

## 📷 OCR Upload Flow

```mermaid
flowchart TD
    A[Student Dashboard] --> B[Upload Question Paper]
    B --> C[Select Image File]
    C --> D[Preview Image]
    D --> E{Image Quality OK?}
    
    E -->|No| F[Retake/Reselect]
    F --> C
    
    E -->|Yes| G[Add Metadata]
    G --> H[Subject/Chapter Tags]
    H --> I[Submit for Processing]
    
    I --> J[OCR Processing]
    J --> K[Text Extraction]
    K --> L[Question Detection]
    L --> M[Review Interface]
    
    M --> N{Accuracy Good?}
    N -->|Yes| O[Approve Questions]
    N -->|No| P[Manual Correction]
    P --> O
    
    O --> Q[Add to Question Bank]
    Q --> R[Available for Practice]
    
```

## 💬 Discussion Participation Flow

```mermaid
flowchart TD
    A[Dashboard] --> B[Community Forums]
    B --> C{Browse or Create?}
    
    C -->|Browse| D[Filter by Subject]
    D --> E[Select Discussion]
    E --> F[Read Messages]
    F --> G{Want to Reply?}
    G -->|Yes| H[Write Response]
    H --> I[Submit Message]
    I --> J[Message Posted]
    G -->|No| K[Continue Browsing]
    
    C -->|Create| L[Choose Category]
    L --> M[Write Title/Content]
    M --> N[Add Tags]
    N --> O[Create Discussion]
    O --> P[Discussion Created]
    
```

## 🎓 Adaptive Learning Flow

```mermaid
flowchart TD
    A[Start Quiz] --> B[Initial Questions]
    B --> C[Answer Question]
    C --> D[Analyze Performance]
    
    D --> E{Performance Level}
    E -->|High| F[Increase Difficulty]
    E -->|Medium| G[Maintain Level]
    E -->|Low| H[Decrease Difficulty]
    
    F --> I[Select Harder Questions]
    G --> J[Select Similar Questions]
    H --> K[Select Easier Questions]
    
    I --> L[Present Next Question]
    J --> L
    K --> L
    
    L --> M{Quiz Complete?}
    M -->|No| C
    M -->|Yes| N[Generate Report]
    N --> O[Show Recommendations]
    
```

## 🔐 Authentication Flow

```mermaid
flowchart TD
    A[User Request] --> B{Has Valid Token?}
    B -->|Yes| C[Allow Access]
    B -->|No| D[Redirect to Login]
    
    D --> E[Enter Credentials]
    E --> F[Validate Credentials]
    F --> G{Valid?}
    
    G -->|Yes| H[Generate JWT]
    H --> I[Set Session]
    I --> J[Redirect to Requested Page]
    
    G -->|No| K[Show Error]
    K --> L{Max Attempts?}
    L -->|No| E
    L -->|Yes| M[Lock Account]
    
    C --> N[Check Permissions]
    N --> O{Authorized?}
    O -->|Yes| P[Serve Content]
    O -->|No| Q[Access Denied]
    
```

## 📊 Performance Analytics Flow

```mermaid
flowchart TD
    A[Quiz Completion] --> B[Store Results]
    B --> C[Update User Stats]
    C --> D[Calculate Metrics]
    
    D --> E[Performance Trends]
    E --> F[Subject Analysis]
    F --> G[Weakness Identification]
    G --> H[Generate Recommendations]
    
    H --> I[Personalized Study Plan]
    I --> J[Suggested Topics]
    J --> K[Recommended Difficulty]
    K --> L[Display to User]
    
    L --> M{User Follows Plan?}
    M -->|Yes| N[Track Progress]
    M -->|No| O[Adjust Recommendations]
    
    N --> P[Update Analytics]
    O --> P
    P --> Q[Continuous Learning]
    
```

## 👥 Collaboration Flow

```mermaid
flowchart TD
    A[Student A] --> B[Creates Study Group]
    B --> C[Invites Students]
    C --> D[Send Invitations]
    
    D --> E[Student B Receives Invite]
    E --> F{Accepts?}
    F -->|Yes| G[Joins Group]
    F -->|No| H[Declines]
    
    G --> I[Group Chat Available]
    I --> J[Share Resources]
    J --> K[Collaborative Quiz]
    K --> L[Real-time Discussion]
    
    L --> M[Knowledge Sharing]
    M --> N[Peer Learning]
    N --> O[Improved Performance]
    
```

## 🔄 Data Synchronization Flow

```mermaid
flowchart TD
    A[User Action] --> B[Frontend Update]
    B --> C[API Request]
    C --> D[Server Processing]
    
    D --> E[Database Update]
    E --> F[Real-time Sync]
    F --> G[WebSocket Broadcast]
    
    G --> H[Other Connected Users]
    H --> I[UI Update]
    
    D --> J[Response to Original User]
    J --> K[Confirm Action]
    K --> L[Update Local State]

```

---

*These diagrams represent the core user flows in TestLoom. For implementation details, see our [Core Architecture](./core-architecture.png).*
