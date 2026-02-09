# Cleanly - Modern Android App

A production-ready Android application built with modern architecture patterns and best practices.

## Architecture

### Clean Architecture + MVVM

The app follows Clean Architecture principles with clear separation of concerns:

```
app/
├── data/           # Data layer (repositories, data sources, local/remote)
├── domain/         # Domain layer (use cases, models, repository interfaces)
└── ui/             # Presentation layer (Compose UI, ViewModels)
```

### Technology Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose (Material 3)
- **Architecture**: MVVM + Clean Architecture
- **Dependency Injection**: Hilt
- **Navigation**: Navigation Compose
- **Async**: Kotlin Coroutines + Flow
- **Networking**: Ktor Client
- **Local Storage**: Room + DataStore
- **Background Work**: WorkManager
- **Image Loading**: Coil
- **Testing**: JUnit + MockK + Compose UI Testing
- **Crash Reporting**: Firebase Crashlytics
- **Analytics**: Firebase Analytics

## Project Structure

```
app/src/main/java/com/example/cleanly/
├── data/
│   ├── local/          # Room database, DataStore
│   ├── remote/         # API services, DTOs
│   ├── repository/     # Repository implementations
│   └── mapper/         # Data mappers
├── domain/
│   ├── model/          # Domain models
│   ├── repository/     # Repository interfaces
│   └── usecase/        # Use cases
├── ui/
│   ├── screen/         # Compose screens
│   ├── theme/          # Material 3 theme
│   └── navigation/     # Navigation setup
├── di/                 # Hilt modules
├── work/               # WorkManager workers
└── MainActivity.kt
```

## Setup

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17 or later
- Android SDK 24+ (minSdk: 24, targetSdk: 36)

### Configuration

1. **API Base URL**: Update `API_BASE_URL` in `app/build.gradle.kts`:
   ```kotlin
   buildConfigField("String", "API_BASE_URL", "\"https://your-api.render.com/api/v1/\"")
   ```

2. **Firebase Setup**:
   - Add your `google-services.json` to `app/` directory
   - Configure Firebase in Firebase Console
   - Enable Crashlytics and Analytics

3. **Build the Project**:
   ```bash
   ./gradlew build
   ```

## Features

### Authentication
- Login/Register with email and password
- JWT token-based authentication
- Secure token storage using DataStore
- Automatic token refresh

### User Management
- User profile viewing
- Profile updates
- Offline-first with Room database caching

### Architecture Features
- **Offline-First**: Data cached locally, works offline
- **Unidirectional Data Flow**: State flows from ViewModel to UI
- **Dependency Injection**: Hilt for clean dependency management
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading indicators during async operations

## Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumented Tests
```bash
./gradlew connectedAndroidTest
```

## Backend Integration

See [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for detailed backend setup instructions.

### Quick Backend Setup

1. **Database**: Set up Neon PostgreSQL
2. **API**: Deploy to Render Web Service
3. **Edge**: Configure Cloudflare DNS and WAF
4. **Environment**: Set API_BASE_URL in build config

## Build Variants

- **Debug**: Development build with debug suffix
- **Release**: Production build with ProGuard/R8

## ProGuard Rules

ProGuard rules are configured in `app/proguard-rules.pro`. Add custom rules as needed.

## Contributing

1. Follow Kotlin coding conventions
2. Write unit tests for use cases
3. Write UI tests for screens
4. Update documentation

## License

[Your License Here]

## Resources

- [Android Developer Documentation](https://developer.android.com)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Hilt Documentation](https://dagger.dev/hilt/)
- [Ktor Client](https://ktor.io/docs/client.html)
- [Room Database](https://developer.android.com/training/data-storage/room)
