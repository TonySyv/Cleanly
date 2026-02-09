package com.example.cleanly.domain.usecase.auth

import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IAuthRepository
import javax.inject.Inject

class RegisterUseCase @Inject constructor(
    private val authRepository: IAuthRepository
) {
    suspend operator fun invoke(email: String, password: String, name: String): Result<User> {
        return authRepository.register(email, password, name)
    }
}
