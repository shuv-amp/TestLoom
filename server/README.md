# TestLoom Server

Backend API server for the TestLoom educational platform built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **User Authentication**: Registration, login, and JWT-based authentication
- **Role-Based Access Control**: Support for students, admins, and moderators
- **Secure Password Handling**: Bcrypt hashing with salt rounds
- **MongoDB Integration**: Mongoose ODM with proper schema validation
- **CORS Configuration**: Cross-origin resource sharing for frontend integration
- **Input Validation**: Comprehensive request validation and error handling

## 📁 Project Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   └── authController.js    # Authentication business logic
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── models/
│   └── userModel.js        # User schema and model
├── routes/
│   └── authRoutes.js       # Authentication API routes
├── .env                    # Environment variables
├── .gitignore             # Git ignore patterns
├── index.js               # Main server file
├── package.json           # Node.js dependencies
└── test-auth.js           # API testing script
```

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### 2. Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 3. Environment Configuration

Edit the `.env` file with your configuration:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/testloom

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# For local MongoDB installation
mongod

# Or use MongoDB Atlas cloud database
# Update MONGO_URI in .env with your Atlas connection string
```

### 5. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 🔗 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/profile` | Get user profile | Private |

### Example API Usage

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "securepass123",
    "role": "student"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

#### Get Profile (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

Run the included test script to verify all endpoints:

```bash
# Start the server first
npm run dev

# In another terminal, run tests
node test-auth.js
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds for secure password storage
- **JWT Tokens**: Secure token-based authentication with expiration
- **Input Validation**: Mongoose schema validation and custom validators
- **CORS Protection**: Configured for specific client origins
- **Error Handling**: Comprehensive error responses without sensitive data exposure

## 🗄️ Database Schema

### User Model

```javascript
{
  name: String,           // Required, 2-50 characters
  email: String,          // Required, unique, valid email format
  password: String,       // Required, min 6 characters (hashed)
  role: String,          // 'student', 'admin', 'moderator'
  isActive: Boolean,     // Account status
  lastLogin: Date,       // Last login timestamp
  createdAt: Date,       // Account creation date
  updatedAt: Date        // Last update date
}
```

## 📝 Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `node test-auth.js`: Run API tests

## 🚨 Important Notes

- Change `JWT_SECRET` in production environment
- Use strong passwords for database connections
- Enable MongoDB authentication in production
- Set `NODE_ENV=production` for production deployments
- Add rate limiting for production use

