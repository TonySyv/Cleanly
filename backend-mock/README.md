# Mock API Server for Cleanly

A simple Express.js mock server for testing the Cleanly Android app locally.

## Quick Start

### 1. Install Dependencies

From `w:\AndroidStudioProjects\Cleanly\backend-mock`:

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for auto-reload during development:

```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 3. Update Android App API URL

In `app/build.gradle.kts`, update the API_BASE_URL:

**For Android Emulator:**
```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")
```

**For Physical Device:**
- Find your computer's IP address (e.g., `192.168.1.100`)
- Update to: `"http://192.168.1.100:3000/api/v1/"`

### 4. Rebuild and Run Android App

```bash
# From project root
gradlew.bat clean build
```

Then run the app from Android Studio.

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update user profile
- `GET /api/v1/health` - Health check

## Notes

- This is a **mock server** - data is stored in memory and resets on restart
- No real password hashing or security - for development only
- Replace with a real backend API for production
