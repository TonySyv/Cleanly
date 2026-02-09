# Setup Guide

## Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17 or later
- Android SDK 24+ (minSdk: 24, targetSdk: 36)
- Git (optional)

## Initial Setup

### 1. Clone/Open Project

```bash
# If cloning from repository
git clone <repository-url>
cd Cleanly

# Or open existing project in Android Studio
```

### 2. Configure API Base URL

Edit `app/build.gradle.kts` and update the API base URL:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://your-api.render.com/api/v1/\"")
```

### 3. Firebase Setup (Optional but Recommended)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add Android app to Firebase project
3. Download `google-services.json`
4. Place `google-services.json` in `app/` directory
5. Update `app/google-services.json` with your actual Firebase configuration

**Note**: The project includes a placeholder `google-services.json`. Replace it with your actual Firebase configuration.

### 4. Build the Project

From the project root directory:

```bash
# Windows
gradlew.bat build

# macOS/Linux
./gradlew build
```

Or use Android Studio:
- Click "Sync Project with Gradle Files"
- Wait for sync to complete
- Build → Make Project

## Running the App

### Debug Build

1. Connect an Android device or start an emulator
2. Click "Run" button in Android Studio
3. Or run from command line:
   ```bash
   gradlew.bat installDebug
   ```

### Release Build

1. Generate signing key (if not already done):
   ```bash
   keytool -genkey -v -keystore cleanly-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cleanly
   ```

2. Create `keystore.properties` in project root:
   ```properties
   storePassword=your-store-password
   keyPassword=your-key-password
   keyAlias=cleanly
   storeFile=cleanly-release.jks
   ```

3. Update `app/build.gradle.kts` to use signing config (see Android documentation)

4. Build release:
   ```bash
   gradlew.bat assembleRelease
   ```

## Backend Setup

See [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for detailed backend setup instructions.

### Dev database (Neon)

For local backend development, the project uses a `.env` file in the project root (gitignored):

- Copy `.env.example` to `.env` if you need to recreate it.
- `DATABASE_URL` in `.env` is set to your Neon PostgreSQL connection string for dev.
- When deploying (e.g. Render), set `DATABASE_URL` in the service environment, not from this file.

### Quick Backend Checklist

- [ ] Set up Neon PostgreSQL database
- [ ] Deploy API to Render Web Service
- [ ] Configure Cloudflare DNS and WAF
- [ ] Update API_BASE_URL in build config
- [ ] Test API endpoints

## Testing

### Run Unit Tests

```bash
gradlew.bat test
```

### Run Instrumented Tests

1. Connect device or start emulator
2. Run:
   ```bash
   gradlew.bat connectedAndroidTest
   ```

### Run UI Tests

```bash
gradlew.bat connectedAndroidTest
```

## Troubleshooting

### Build Errors

1. **Gradle Sync Failed**
   - Check internet connection
   - Invalidate caches: File → Invalidate Caches / Restart
   - Delete `.gradle` folder and sync again

2. **Kotlin Version Mismatch**
   - Ensure Kotlin version matches in all build files
   - Check `gradle/libs.versions.toml`

3. **Hilt Errors**
   - Ensure `@HiltAndroidApp` is on Application class
   - Check all modules have `@Module` and `@InstallIn`
   - Clean and rebuild project

### Runtime Errors

1. **App Crashes on Launch**
   - Check Logcat for error messages
   - Verify `google-services.json` is correct (if using Firebase)
   - Check API_BASE_URL is set correctly

2. **Network Errors**
   - Verify API_BASE_URL is correct
   - Check device/emulator has internet connection
   - Verify backend is running and accessible

3. **Database Errors**
   - Clear app data: Settings → Apps → Cleanly → Clear Data
   - Or uninstall and reinstall app

## Development Workflow

### Adding a New Feature

1. **Create Domain Model** (`domain/model/`)
2. **Create Use Case** (`domain/usecase/`)
3. **Create Repository Interface** (`domain/repository/`)
4. **Implement Repository** (`data/repository/`)
5. **Create API Service** (`data/remote/api/`)
6. **Create Room Entity** (`data/local/entity/`)
7. **Create ViewModel** (`ui/screen/[feature]/`)
8. **Create Compose Screen** (`ui/screen/[feature]/`)
9. **Add Navigation Route** (`ui/navigation/`)
10. **Add Hilt Bindings** (`di/`)

### Code Style

- Follow Kotlin coding conventions
- Use meaningful variable and function names
- Add KDoc comments for public APIs
- Keep functions small and focused
- Use data classes for state

## Next Steps

1. ✅ Project setup complete
2. ⏭️ Configure backend API
3. ⏭️ Set up Firebase (optional)
4. ⏭️ Customize theme and branding
5. ⏭️ Add your app-specific features
6. ⏭️ Write tests
7. ⏭️ Prepare for release

## Resources

- [Android Developer Documentation](https://developer.android.com)
- [Jetpack Compose Tutorial](https://developer.android.com/jetpack/compose/tutorial)
- [Hilt Documentation](https://dagger.dev/hilt/)
- [Ktor Client Guide](https://ktor.io/docs/client.html)
- [Room Database Guide](https://developer.android.com/training/data-storage/room)
