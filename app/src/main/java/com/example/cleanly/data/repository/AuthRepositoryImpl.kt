package com.example.cleanly.data.repository

import com.example.cleanly.data.local.dao.UserDao
import com.example.cleanly.data.local.datastore.AuthDataStore
import com.example.cleanly.data.mapper.toDomain
import com.example.cleanly.data.mapper.toEntity
import com.example.cleanly.data.remote.api.ApiService
import com.example.cleanly.data.remote.model.AuthRequest
import com.example.cleanly.data.remote.model.RegisterRequest
import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IAuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val authDataStore: AuthDataStore,
    private val userDao: UserDao
) : IAuthRepository {

    override suspend fun login(email: String, password: String): Result<User> {
        return apiService.login(AuthRequest(email, password))
            .fold(
                onSuccess = { response ->
                    authDataStore.saveAuthToken(response.accessToken)
                    authDataStore.saveRefreshToken(response.refreshToken)
                    authDataStore.saveUserId(response.user.id)
                    val user = response.user.toDomain()
                    userDao.insertUser(user.toEntity())
                    Result.success(user)
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
                    val user = response.user.toDomain()
                    userDao.insertUser(user.toEntity())
                    Result.success(user)
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
        return authDataStore.userId.first()
    }

    override fun getCurrentUser(): Flow<User?> {
        return authDataStore.userId.flatMapLatest { userId ->
            if (userId != null) {
                userDao.getUserById(userId).map { it?.toDomain() }
            } else {
                flowOf(null)
            }
        }
    }
}
