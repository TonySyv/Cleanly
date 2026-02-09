package com.example.cleanly.domain.usecase.user

import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IUserRepository
import javax.inject.Inject

class UpdateUserProfileUseCase @Inject constructor(
    private val userRepository: IUserRepository
) {
    suspend operator fun invoke(userId: String, name: String?, avatarUrl: String?): Result<User> {
        return userRepository.updateUserProfile(userId, name, avatarUrl)
    }
}
