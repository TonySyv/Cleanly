package com.example.cleanly.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class AuthRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val role: String? = "CUSTOMER"
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val name: String,
    val avatarUrl: String? = null,
    val role: String? = "CUSTOMER",
    val createdAt: String,
    val updatedAt: String
)
