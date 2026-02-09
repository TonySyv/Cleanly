package com.example.cleanly.domain.usecase.user

import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IUserRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetUserProfileUseCase @Inject constructor(
    private val userRepository: IUserRepository
) {
    operator fun invoke(userId: String): Flow<User?> {
        return userRepository.getUserProfile(userId)
    }
}
