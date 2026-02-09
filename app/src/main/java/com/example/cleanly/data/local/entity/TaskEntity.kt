package com.example.cleanly.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
    val id: String,
    val userId: String,
    val title: String,
    val completed: Boolean,
    val createdAt: Long,
    val updatedAt: Long
)
