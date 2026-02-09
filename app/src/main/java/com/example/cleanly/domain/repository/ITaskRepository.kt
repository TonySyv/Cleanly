package com.example.cleanly.domain.repository

import com.example.cleanly.domain.model.Task
import kotlinx.coroutines.flow.Flow

interface ITaskRepository {
    fun getTasks(userId: String): Flow<List<Task>>
    suspend fun refreshTasks(userId: String)
    suspend fun createTask(userId: String, title: String): Result<Task>
    suspend fun updateTask(taskId: String, title: String?, completed: Boolean?): Result<Task>
    suspend fun deleteTask(taskId: String): Result<Unit>
}
