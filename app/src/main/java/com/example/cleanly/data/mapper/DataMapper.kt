package com.example.cleanly.data.mapper

import com.example.cleanly.data.local.entity.TaskEntity
import com.example.cleanly.data.local.entity.UserEntity
import com.example.cleanly.data.remote.model.TaskDto
import com.example.cleanly.data.remote.model.UserDto
import com.example.cleanly.domain.model.Task
import com.example.cleanly.domain.model.User
import java.time.Instant
import java.time.format.DateTimeFormatter

fun UserDto.toDomain(): User {
    return User(
        id = id,
        email = email,
        name = name,
        avatarUrl = avatarUrl,
        createdAt = parseTimestamp(createdAt),
        updatedAt = parseTimestamp(updatedAt)
    )
}

fun User.toEntity(): UserEntity {
    return UserEntity(
        id = id,
        email = email,
        name = name,
        avatarUrl = avatarUrl,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun UserEntity.toDomain(): User {
    return User(
        id = id,
        email = email,
        name = name,
        avatarUrl = avatarUrl,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun TaskDto.toDomain(): Task {
    return Task(
        id = id,
        userId = userId,
        title = title,
        completed = completed,
        createdAt = parseTimestamp(createdAt),
        updatedAt = parseTimestamp(updatedAt)
    )
}

fun Task.toEntity(): TaskEntity {
    return TaskEntity(
        id = id,
        userId = userId,
        title = title,
        completed = completed,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun TaskEntity.toDomain(): Task {
    return Task(
        id = id,
        userId = userId,
        title = title,
        completed = completed,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

private fun parseTimestamp(timestamp: String): Long {
    return try {
        Instant.parse(timestamp).toEpochMilli()
    } catch (e: Exception) {
        System.currentTimeMillis()
    }
}
