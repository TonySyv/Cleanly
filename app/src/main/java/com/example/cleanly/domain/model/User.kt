package com.example.cleanly.domain.model

data class User(
    val id: String,
    val email: String,
    val name: String,
    val avatarUrl: String? = null,
    val role: String = "CUSTOMER",
    val createdAt: Long,
    val updatedAt: Long
)
