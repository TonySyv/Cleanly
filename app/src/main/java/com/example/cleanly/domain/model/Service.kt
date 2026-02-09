package com.example.cleanly.domain.model

data class Service(
    val id: String,
    val name: String,
    val description: String?,
    val basePriceCents: Int,
    val durationMinutes: Int,
    val active: Boolean
)
