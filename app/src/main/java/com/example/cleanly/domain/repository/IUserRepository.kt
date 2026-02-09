package com.example.cleanly.domain.repository

import com.example.cleanly.domain.model.User
import kotlinx.coroutines.flow.Flow

interface IUserRepository {
    fun getUserProfile(userId: String): Flow<User?>
    suspend fun refreshUserProfile(userId: String): Result<User>
    suspend fun updateUserProfile(userId: String, name: String?, avatarUrl: String?): Result<User>
}
