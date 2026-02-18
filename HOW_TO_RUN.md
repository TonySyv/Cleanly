# How to Interact with the Cleanly App

Now that your database URL is set up, here's how to get the app running and interacting with a backend.

## Architecture Overview

```
Android App → Backend API → PostgreSQL Database (Neon)
```

- **Android App**: Your Cleanly app (this project)
- **Backend API**: Needs to be running (see options below)
- **Database**: Your Neon PostgreSQL (already configured in `.env`)

## Option 1: Real Backend (Recommended)

A full backend in **`backend/`** uses your Neon database and JWT auth.

From **`w:\AndroidStudioProjects\Cleanly\backend`**:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm start
```

**Important:** Run `npm run db:seed` after migrations so the database has services (Regular clean, Deep clean, Move-out clean) and test users. Without seeding, the services list will be empty and the app will look empty. Seed creates: customer@test.com, provider@test.com, admin@test.com, company@test.com, employee@test.com (password: `password123`), plus promo code WELCOME10.

The app is already configured to use `http://10.0.2.2:3000/api/v1/` when you run the backend on port 3000. See **`backend/README.md`** for details.

## Option 2: Mock Server (No Database)

### Step 1: Start the Mock API Server

From `w:\AndroidStudioProjects\Cleanly\backend-mock`:

```bash
npm install
npm start
```

The server runs on `http://localhost:3000`

### Step 2: Update Android App API URL

Edit `app/build.gradle.kts`:

**For Android Emulator:**
```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")
```

**For Physical Device:**
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update to: `"http://YOUR_IP:3000/api/v1/"` (e.g., `"http://192.168.1.100:3000/api/v1/"`)

### Step 3: Rebuild and Run

From `w:\AndroidStudioProjects\Cleanly`:

- **From Android Studio**: Build → Rebuild Project, then Run. The IDE uses Java 17.
- **From command line**: Java 17 is required. Set `JAVA_HOME` to a JDK 17 installation (e.g. [Eclipse Temurin](https://adoptium.net/)), then run:

```bash
.\gradlew.bat assembleDebug
```
(or `gradlew.bat clean build` for a full build). Then run the app from Android Studio or install the APK from `app/build/outputs/apk/`.

### Step 4: Test the App

1. **Register**: Tap "Don't have an account? Register"
   - Enter email, password, and name
   - Tap "Register"

2. **Login**: Enter your email and password, tap "Login"

3. **View Profile**: After login, you'll see the home screen and can navigate to profile

**Note**: Mock server stores data in memory - it resets when you restart the server.

---

## Option 3: Create a Custom Backend

If you want to use your actual Neon database, you need to create a backend API.

### Quick Backend Options:

#### A. Node.js/Express (Fastest)

1. Create a new backend project or use the example in `BACKEND_ARCHITECTURE.md`
2. Use the `DATABASE_URL` from `.env`:
   ```bash
   DATABASE_URL=postgresql://neondb_owner:npg_Xlni1gM0NhdZ@ep-wild-firefly-a1eglmgv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
3. Deploy to Render or run locally
4. Update `API_BASE_URL` in `app/build.gradle.kts` to point to your backend

#### B. Kotlin/Ktor (Code Sharing with Android)

See `BACKEND_ARCHITECTURE.md` for Ktor example.

#### C. Python/FastAPI

See `BACKEND_ARCHITECTURE.md` for FastAPI example.

### Database Setup

Before running your backend, create the database tables:

```sql
-- Run this in your Neon database console or via psql

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## Option 4: Use Existing Backend

If you already have a backend API deployed:

1. Update `API_BASE_URL` in `app/build.gradle.kts`:
   ```kotlin
   buildConfigField("String", "API_BASE_URL", "\"https://your-actual-api.com/api/v1/\"")
   ```

2. Rebuild:
   ```bash
   gradlew.bat clean build
   ```

3. Run the app

---

## Troubleshooting

### "Network error" or "Connection refused"

- **Emulator**: Use `10.0.2.2` instead of `localhost`
- **Physical device**: Ensure your phone and computer are on the same WiFi network
- Check that the backend server is running
- Verify the API_BASE_URL is correct

### "API_BASE_URL not found"

- Clean and rebuild: `gradlew.bat clean build`
- Sync Gradle in Android Studio: File → Sync Project with Gradle Files

### Backend not connecting to database

- Verify `DATABASE_URL` in `.env` is correct
- Check Neon database is accessible (not paused)
- Ensure SSL mode is set correctly (`sslmode=require`)

---

## Next Steps

1. ✅ Database URL configured (`.env`)
2. ⏭️ Start backend API (mock or real)
3. ⏭️ Update `API_BASE_URL` in Android app
4. ⏭️ Rebuild and run app
5. ⏭️ Test login/register flow

For detailed backend setup, see [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)
