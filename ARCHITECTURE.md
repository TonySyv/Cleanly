# Cleanly Architecture Documentation

## Overview

Cleanly follows **Clean Architecture** principles with **MVVM** pattern, ensuring separation of concerns, testability, and maintainability.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           UI Layer (Compose)            │
│  - Screens                              │
│  - ViewModels                           │
│  - Navigation                           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Domain Layer                   │
│  - Use Cases                           │
│  - Domain Models                       │
│  - Repository Interfaces              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Layer                     │
│  - Repository Implementations          │
│  - Data Sources (Remote/Local)         │
│  - Data Models (DTOs/Entities)         │
└─────────────────────────────────────────┘
```

## Layer Details

### UI Layer (`ui/`)

**Responsibility**: Presentation logic and user interaction

- **Screens**: Jetpack Compose UI components
- **ViewModels**: State management using StateFlow
- **Navigation**: Navigation Compose setup

**Key Components**:
- `LoginScreen` / `LoginViewModel`
- `RegisterScreen` / `RegisterViewModel`
- `HomeScreen`
- `ProfileScreen` / `ProfileViewModel`

**State Management**:
```kotlin
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val isLoginSuccessful: Boolean = false,
    val errorMessage: String? = null
)
```

### Domain Layer (`domain/`)

**Responsibility**: Business logic and use cases

- **Use Cases**: Single responsibility operations
- **Models**: Domain entities (pure Kotlin data classes)
- **Repository Interfaces**: Contracts for data access

**Key Components**:
- `LoginUseCase` - Handles user login
- `RegisterUseCase` - Handles user registration
- `GetUserProfileUseCase` - Fetches user profile
- `UpdateUserProfileUseCase` - Updates user profile

**Example Use Case**:
```kotlin
class LoginUseCase @Inject constructor(
    private val authRepository: IAuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<User> {
        return authRepository.login(email, password)
    }
}
```

### Data Layer (`data/`)

**Responsibility**: Data management and API communication

**Sub-layers**:
1. **Remote** (`remote/`): API services, DTOs
2. **Local** (`local/`): Room database, DataStore
3. **Repository** (`repository/`): Repository implementations

**Key Components**:
- `ApiService` - Ktor-based API client
- `AuthRepositoryImpl` - Authentication repository
- `UserRepositoryImpl` - User data repository
- `AuthDataStore` - Secure token storage
- `CleanlyDatabase` - Room database

## Data Flow

### Unidirectional Data Flow

```
User Action → ViewModel → Use Case → Repository → Data Source
                ↓
            UI State (Flow)
                ↓
            Compose UI
```

### Example: Login Flow

1. **User Action**: User enters credentials and taps "Login"
2. **ViewModel**: `LoginViewModel.login()` called
3. **Use Case**: `LoginUseCase` invoked with credentials
4. **Repository**: `AuthRepositoryImpl.login()` called
5. **API Service**: `ApiService.login()` makes HTTP request
6. **Response**: Token saved to DataStore, user data cached in Room
7. **State Update**: ViewModel updates `uiState`
8. **UI Update**: Compose recomposes with new state

## Dependency Injection (Hilt)

### Modules

- **AppModule**: Core dependencies (Database, DataStore, HTTP Client, Repositories, Use Cases)
- **NetworkModule**: Authenticated HTTP client configuration
- **WorkManagerModule**: WorkManager setup

### Injection Points

- `@HiltAndroidApp` - Application class
- `@AndroidEntryPoint` - Activities
- `@HiltViewModel` - ViewModels
- `@HiltWorker` - WorkManager workers

## Offline-First Strategy

### Caching Strategy

1. **Room Database**: Primary cache for user data
2. **DataStore**: Secure storage for auth tokens and preferences
3. **Flow-based**: UI observes Room Flow, automatically updates when data changes

### Sync Strategy

1. **On App Start**: Check for cached data, display immediately
2. **Background Sync**: WorkManager syncs data periodically
3. **On User Action**: Refresh data when user explicitly requests

## Error Handling

### Error Types

1. **Network Errors**: Handled in API service, wrapped in Result
2. **Validation Errors**: Handled in ViewModels
3. **Database Errors**: Handled in repositories

### Error Flow

```kotlin
Result.failure(exception)
    ↓
ViewModel catches error
    ↓
Updates uiState.errorMessage
    ↓
UI displays error message
```

## Testing Strategy

### Unit Tests

- **Use Cases**: Test business logic
- **ViewModels**: Test state management
- **Repositories**: Mock data sources

### UI Tests

- **Compose UI Tests**: Test screen interactions
- **Navigation Tests**: Test navigation flow

### Test Doubles

- **MockK**: Mocking framework
- **Turbine**: Flow testing
- **Coroutines Test**: Coroutine testing utilities

## Key Design Patterns

### 1. Repository Pattern
- Abstracts data sources
- Single source of truth
- Easy to swap implementations

### 2. Use Case Pattern
- Single responsibility
- Reusable business logic
- Easy to test

### 3. MVVM Pattern
- Separation of concerns
- Lifecycle-aware
- Testable ViewModels

### 4. Observer Pattern (Flow)
- Reactive data streams
- Automatic UI updates
- Backpressure handling

## Scalability Considerations

### Current Architecture Supports

- ✅ Multiple data sources (Remote + Local)
- ✅ Background sync (WorkManager)
- ✅ Offline-first (Room caching)
- ✅ Dependency injection (Hilt)
- ✅ Modular structure (Easy to add features)

### Future Enhancements

- Add feature modules
- Implement pagination
- Add real-time updates (WebSocket)
- Implement caching strategies (Redis-like)
- Add analytics and monitoring

## Code Organization

```
com.example.cleanly/
├── data/
│   ├── local/
│   │   ├── entity/          # Room entities
│   │   ├── dao/             # Data Access Objects
│   │   ├── datastore/       # DataStore utilities
│   │   └── CleanlyDatabase.kt
│   ├── remote/
│   │   ├── api/             # API services
│   │   └── model/           # DTOs
│   ├── repository/          # Repository implementations
│   └── mapper/              # Data mappers
├── domain/
│   ├── model/               # Domain models
│   ├── repository/          # Repository interfaces
│   └── usecase/             # Use cases
├── ui/
│   ├── screen/              # Compose screens
│   ├── theme/               # Material 3 theme
│   └── navigation/          # Navigation setup
├── di/                      # Hilt modules
├── work/                    # WorkManager workers
└── MainActivity.kt
```

## Best Practices

1. **Single Source of Truth**: Room database is the source of truth
2. **Immutable State**: UI state is immutable data classes
3. **Error Handling**: All errors handled gracefully with user feedback
4. **Loading States**: Always show loading indicators for async operations
5. **Offline Support**: App works offline with cached data
6. **Security**: Sensitive data stored securely (DataStore, not SharedPreferences)

## Resources

- [Android Architecture Guide](https://developer.android.com/topic/architecture)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [MVVM Pattern](https://developer.android.com/topic/architecture/ui-layer)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
