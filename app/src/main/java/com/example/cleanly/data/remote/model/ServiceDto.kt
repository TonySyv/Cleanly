package com.example.cleanly.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class ServiceDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val basePriceCents: Int,
    val durationMinutes: Int,
    val active: Boolean = true,
    val createdAt: String,
    val updatedAt: String
)
