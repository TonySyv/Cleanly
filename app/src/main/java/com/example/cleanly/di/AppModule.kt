package com.example.cleanly.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.example.cleanly.data.local.CleanlyDatabase
import com.example.cleanly.data.local.dao.TaskDao
import com.example.cleanly.data.local.dao.UserDao
import com.example.cleanly.data.local.datastore.AuthDataStore
import com.example.cleanly.data.remote.api.ApiService
import com.example.cleanly.data.remote.api.ApiServiceImpl
import com.example.cleanly.data.repository.AuthRepositoryImpl
import com.example.cleanly.data.repository.BookingRepositoryImpl
import com.example.cleanly.data.repository.TaskRepositoryImpl
import com.example.cleanly.data.repository.UserRepositoryImpl
import com.example.cleanly.domain.repository.IAuthRepository
import com.example.cleanly.domain.repository.IBookingRepository
import com.example.cleanly.domain.repository.ITaskRepository
import com.example.cleanly.domain.repository.IUserRepository
import com.example.cleanly.domain.usecase.booking.CancelBookingUseCase
import com.example.cleanly.domain.usecase.booking.ConfirmBookingPaymentUseCase
import com.example.cleanly.domain.usecase.booking.CreateBookingUseCase
import com.example.cleanly.domain.usecase.booking.GetBookingUseCase
import com.example.cleanly.domain.usecase.booking.GetBookingsUseCase
import com.example.cleanly.domain.usecase.booking.GetServicesUseCase
import com.example.cleanly.domain.usecase.auth.LoginUseCase
import com.example.cleanly.domain.usecase.auth.LogoutUseCase
import com.example.cleanly.domain.usecase.auth.RegisterUseCase
import com.example.cleanly.domain.usecase.task.CreateTaskUseCase
import com.example.cleanly.domain.usecase.task.DeleteTaskUseCase
import com.example.cleanly.domain.usecase.task.GetTasksUseCase
import com.example.cleanly.domain.usecase.task.RefreshTasksUseCase
import com.example.cleanly.domain.usecase.task.UpdateTaskUseCase
import com.example.cleanly.domain.usecase.user.GetUserProfileUseCase
import com.example.cleanly.di.AuthenticatedClient
import com.example.cleanly.domain.usecase.user.UpdateUserProfileUseCase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.ktor.client.HttpClient
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "cleanly_preferences")

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return context.dataStore
    }

    @Provides
    @Singleton
    fun provideAuthDataStore(dataStore: DataStore<Preferences>): AuthDataStore {
        return AuthDataStore(dataStore)
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): CleanlyDatabase {
        return Room.databaseBuilder(
            context,
            CleanlyDatabase::class.java,
            "cleanly_database"
        )
            .fallbackToDestructiveMigration() // Remove in production, add proper migrations
            .build()
    }

    @Provides
    @Singleton
    fun provideUserDao(database: CleanlyDatabase): UserDao {
        return database.userDao()
    }

    @Provides
    @Singleton
    fun provideTaskDao(database: CleanlyDatabase): TaskDao {
        return database.taskDao()
    }

    @Provides
    @Singleton
    fun provideApiService(@AuthenticatedClient httpClient: HttpClient): ApiService {
        return ApiServiceImpl(httpClient)
    }

    @Provides
    @Singleton
    fun provideAuthRepository(
        apiService: ApiService,
        authDataStore: AuthDataStore
    ): IAuthRepository {
        return AuthRepositoryImpl(apiService, authDataStore)
    }

    @Provides
    @Singleton
    fun provideUserRepository(
        apiService: ApiService,
        userDao: UserDao,
        authDataStore: AuthDataStore
    ): IUserRepository {
        return UserRepositoryImpl(apiService, userDao, authDataStore)
    }

    @Provides
    @Singleton
    fun provideTaskRepository(
        apiService: ApiService,
        taskDao: TaskDao,
        authDataStore: AuthDataStore
    ): ITaskRepository {
        return TaskRepositoryImpl(apiService, taskDao, authDataStore)
    }

    @Provides
    @Singleton
    fun provideBookingRepository(apiService: ApiService): IBookingRepository {
        return BookingRepositoryImpl(apiService)
    }

    @Provides
    fun provideLoginUseCase(authRepository: IAuthRepository): LoginUseCase {
        return LoginUseCase(authRepository)
    }

    @Provides
    fun provideRegisterUseCase(authRepository: IAuthRepository): RegisterUseCase {
        return RegisterUseCase(authRepository)
    }

    @Provides
    fun provideLogoutUseCase(authRepository: IAuthRepository): LogoutUseCase {
        return LogoutUseCase(authRepository)
    }

    @Provides
    fun provideGetUserProfileUseCase(userRepository: IUserRepository): GetUserProfileUseCase {
        return GetUserProfileUseCase(userRepository)
    }

    @Provides
    fun provideUpdateUserProfileUseCase(userRepository: IUserRepository): UpdateUserProfileUseCase {
        return UpdateUserProfileUseCase(userRepository)
    }

    @Provides
    fun provideGetTasksUseCase(taskRepository: ITaskRepository): GetTasksUseCase {
        return GetTasksUseCase(taskRepository)
    }

    @Provides
    fun provideRefreshTasksUseCase(taskRepository: ITaskRepository): RefreshTasksUseCase {
        return RefreshTasksUseCase(taskRepository)
    }

    @Provides
    fun provideCreateTaskUseCase(taskRepository: ITaskRepository): CreateTaskUseCase {
        return CreateTaskUseCase(taskRepository)
    }

    @Provides
    fun provideUpdateTaskUseCase(taskRepository: ITaskRepository): UpdateTaskUseCase {
        return UpdateTaskUseCase(taskRepository)
    }

    @Provides
    fun provideDeleteTaskUseCase(taskRepository: ITaskRepository): DeleteTaskUseCase {
        return DeleteTaskUseCase(taskRepository)
    }

    @Provides
    fun provideGetServicesUseCase(repository: IBookingRepository): GetServicesUseCase {
        return GetServicesUseCase(repository)
    }

    @Provides
    fun provideGetBookingsUseCase(repository: IBookingRepository): GetBookingsUseCase {
        return GetBookingsUseCase(repository)
    }

    @Provides
    fun provideGetBookingUseCase(repository: IBookingRepository): GetBookingUseCase {
        return GetBookingUseCase(repository)
    }

    @Provides
    fun provideCreateBookingUseCase(repository: IBookingRepository): CreateBookingUseCase {
        return CreateBookingUseCase(repository)
    }

    @Provides
    fun provideConfirmBookingPaymentUseCase(repository: IBookingRepository): ConfirmBookingPaymentUseCase {
        return ConfirmBookingPaymentUseCase(repository)
    }

    @Provides
    fun provideCancelBookingUseCase(repository: IBookingRepository): CancelBookingUseCase {
        return CancelBookingUseCase(repository)
    }
}
