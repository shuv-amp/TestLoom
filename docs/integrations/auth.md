# 🔐 Authentication Integration Guide

## Overview

TestLoom implements a comprehensive authentication system using JWT tokens with refresh token rotation, role-based access control (RBAC), and optional multi-factor authentication (MFA).

### Key Features
- **JWT Authentication**: Stateless token-based authentication with RS256 algorithm
- **Refresh Token Rotation**: Enhanced security with token rotation
- **Role-Based Access Control**: Fine-grained permission system
- **Multi-Factor Authentication**: TOTP and SMS-based 2FA
- **Social Login**: Google, GitHub
- **Session Management**: Secure session handling
- **Password Policies**: Enforced password complexity

### Security Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  Auth Middleware │───▶│  Protected API  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Token Storage  │    │   JWT Validator  │    │   User Service  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Refresh Tokens  │    │  Security Events │    │   RBAC Engine   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

