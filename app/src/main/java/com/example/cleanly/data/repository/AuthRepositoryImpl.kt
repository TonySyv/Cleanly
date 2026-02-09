package com.example.cleanly.data.repository

import com.example.cleanly.data.local.datastore.AuthDataStore
import com.example.cleanly.data.local.entity.UserEntity
import com.example.cleanly.data.mapper.toDomain
import com.example.cleanly.data.remote.api.ApiService
import com.example.cleanly.data.remote.model.AuthRequest
import com.example.cleanly.data.remote.model.RegisterRequest
import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IAuthRepository
import kotlinx.coroutines.flow.first
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val authDataStore: AuthDataStore
) : IAuthRepository {

    override suspend fun login(email: String, password: String): Result<User> {
        return apiService.login(AuthRequest(email, password))
            .fold(
                onSuccess = { response ->
                    authDataStore.saveAuthToken(response.accessToken)
                    authDataStore.saveRefreshToken(response.refreshToken)
                    authDataStore.saveUserId(response.user.id)
                    Result.success(response.user.toDomain())
                },
                onFailure = { Result.failure(it) }
            )
    }

    override suspend fun register(email: String, password: String, name: String): Result<User> {
        return apiService.register(RegisterRequest(email, password, name))
            .fold(
                onSuccess = { response ->
                    authDataStore.saveAuthToken(response.accessToken)
                    authDataStore.saveRefreshToken(response.refreshToken)
                    authDataStore.saveUserId(response.user.id)
                    Result.success(response.user.toDomain())
                },
                onFailure = { Result.failure(it) }
            )
    }

    override suspend fun logout() {
        authDataStore.clearAuth()
    }

    override suspend fun isLoggedIn(): Boolean {
        return authDataStore.getAuthToken().first() != null
    }

    override suspend fun getCurrentUserId(): String? {
        return authDataStore.getUserId().first()
    }
}
