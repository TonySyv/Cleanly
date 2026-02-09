package com.example.cleanly.domain.usecase.auth

import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IAuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: IAuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<User> {
        return authRepository.login(email, password)
    }
}
