#!/usr/bin/env node

/**
 * Simple test script for authentication endpoints
 * Run this after starting the server to test the API
 */

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@testloom.com',
  password: 'testpass123',
  role: 'student'
};

console.log('🧪 Testing TestLoom Authentication API\n');

// Test 1: Health Check
console.log('1. Testing health check endpoint...');
fetch(`${BASE_URL}`)
  .then(res => res.json())
  .then(data => {
    console.log('✅ Health check passed:', data.message);
    return testRegistration();
  })
  .catch(err => {
    console.error('❌ Health check failed:', err.message);
  });

// Test 2: User Registration
async function testRegistration() {
  console.log('\n2. Testing user registration...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful');
      console.log('   User ID:', data.data.user.id);
      console.log('   Token received:', data.data.token ? 'Yes' : 'No');
      return testLogin(data.data.token);
    } else {
      console.log('ℹ️  Registration response:', data.message);
      // If user already exists, try login
      if (response.status === 409) {
        return testLogin();
      }
    }
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
  }
}

// Test 3: User Login
async function testLogin(existingToken = null) {
  console.log('\n3. Testing user login...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful');
      console.log('   User:', data.data.user.name);
      console.log('   Role:', data.data.user.role);
      return testProtectedRoute(data.data.token);
    } else {
      console.log('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  }
}

// Test 4: Protected Route
async function testProtectedRoute(token) {
  console.log('\n4. Testing protected route...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Protected route access successful');
      console.log('   Profile:', data.data.user.name);
      console.log('   Created:', new Date(data.data.user.createdAt).toLocaleDateString());
    } else {
      console.log('❌ Protected route failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Protected route failed:', error.message);
  }
  
  console.log('\n🎉 Testing completed!');
}
