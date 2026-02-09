package com.example.cleanly.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class TaskDto(
    val id: String,
    val userId: String,
    val title: String,
    val completed: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateTaskRequest(
    val title: String
)

@Serializable
data class UpdateTaskRequest(
    val title: String? = null,
    val completed: Boolean? = null
)
