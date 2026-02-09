package com.example.cleanly.domain.usecase.auth

import com.example.cleanly.domain.repository.IAuthRepository
import javax.inject.Inject

class LogoutUseCase @Inject constructor(
    private val authRepository: IAuthRepository
) {
    suspend operator fun invoke() {
        authRepository.logout()
    }
}
