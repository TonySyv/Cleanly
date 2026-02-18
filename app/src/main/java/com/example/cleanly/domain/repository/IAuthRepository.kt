package com.example.cleanly.domain.repository

import com.example.cleanly.domain.model.User
import kotlinx.coroutines.flow.Flow

interface IAuthRepository {
    suspend fun login(email: String, password: String): Result<User>
    suspend fun register(email: String, password: String, name: String): Result<User>
    suspend fun logout()
    suspend fun isLoggedIn(): Boolean
    suspend fun getCurrentUserId(): String?
    fun getCurrentUser(): Flow<User?>
}
