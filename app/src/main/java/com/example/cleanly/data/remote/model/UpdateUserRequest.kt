package com.example.cleanly.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class UpdateUserRequest(
    val name: String? = null,
    val avatarUrl: String? = null
)

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String
)
