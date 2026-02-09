package com.example.cleanly.domain.model

data class Task(
    val id: String,
    val userId: String,
    val title: String,
    val completed: Boolean,
    val createdAt: Long,
    val updatedAt: Long
)
