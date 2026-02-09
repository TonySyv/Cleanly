const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with real DB later)
const users = [];
const refreshTokens = [];

// Helper: Generate JWT-like token (mock)
function generateToken() {
  return `mock_token_${uuidv4()}`;
}

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email, password, and name are required'
      }
    });
  }

  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(409).json({
      error: {
        code: 'USER_EXISTS',
        message: 'User with this email already exists'
      }
    });
  }

  const userId = uuidv4();
  const newUser = {
    id: userId,
    email,
    name,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(newUser);

  const accessToken = generateToken();
  const refreshToken = generateToken();
  
  refreshTokens.push({
    userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  res.status(201).json({
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user: newUser
  });
});

// Login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      }
    });
  }

  // Find user (in real app, verify password hash)
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  }

  const accessToken = generateToken();
  const refreshToken = generateToken();
  
  refreshTokens.push({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user
  });
});

// Refresh token
app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required'
      }
    });
  }

  const storedToken = refreshTokens.find(t => t.token === token);
  
  if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired refresh token'
      }
    });
  }

  const user = users.find(u => u.id === storedToken.userId);
  const newAccessToken = generateToken();

  res.json({
    accessToken: newAccessToken,
    refreshToken: token,
    expiresIn: 3600,
    user
  });
});

// Get user profile
app.get('/api/v1/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    });
  }

  res.json(user);
});

// Update user profile
app.put('/api/v1/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, avatarUrl } = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    });
  }

  if (name) users[userIndex].name = name;
  if (avatarUrl !== undefined) users[userIndex].avatarUrl = avatarUrl;
  users[userIndex].updatedAt = new Date().toISOString();

  res.json(users[userIndex]);
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log(`📱 Update API_BASE_URL to: http://10.0.2.2:${PORT}/api/v1/ (for Android emulator)`);
  console.log(`📱 Or use your computer's IP for physical device`);
});
