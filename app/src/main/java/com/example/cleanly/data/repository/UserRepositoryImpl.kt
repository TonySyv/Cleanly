package com.example.cleanly.data.repository

import com.example.cleanly.data.local.dao.UserDao
import com.example.cleanly.data.local.datastore.AuthDataStore
import com.example.cleanly.data.local.entity.UserEntity
import com.example.cleanly.data.mapper.toDomain
import com.example.cleanly.data.mapper.toEntity
import com.example.cleanly.data.remote.api.ApiService
import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IUserRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class UserRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val userDao: UserDao,
    private val authDataStore: AuthDataStore
) : IUserRepository {

    override fun getUserProfile(userId: String): Flow<User?> {
        return userDao.getUserById(userId).map { it?.toDomain() }
    }

    override suspend fun refreshUserProfile(userId: String): Result<User> {
        return apiService.getUserProfile(userId)
            .fold(
                onSuccess = { userDto ->
                    val user = userDto.toDomain()
                    userDao.insertUser(user.toEntity())
                    Result.success(user)
                },
                onFailure = { Result.failure(it) }
            )
    }

    override suspend fun updateUserProfile(
        userId: String,
        name: String?,
        avatarUrl: String?
    ): Result<User> {
        return apiService.updateUserProfile(userId, name, avatarUrl)
            .fold(
                onSuccess = { userDto ->
                    val user = userDto.toDomain()
                    userDao.insertUser(user.toEntity())
                    Result.success(user)
                },
                onFailure = { Result.failure(it) }
            )
    }
}
