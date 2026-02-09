package com.example.cleanly.data.repository

import com.example.cleanly.data.local.dao.TaskDao
import com.example.cleanly.data.local.datastore.AuthDataStore
import com.example.cleanly.data.mapper.toDomain
import com.example.cleanly.data.mapper.toEntity
import com.example.cleanly.data.remote.api.ApiService
import com.example.cleanly.domain.model.Task
import com.example.cleanly.domain.repository.ITaskRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class TaskRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val taskDao: TaskDao,
    private val authDataStore: AuthDataStore
) : ITaskRepository {

    override fun getTasks(userId: String): Flow<List<Task>> {
        return taskDao.getTasksByUserId(userId).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun refreshTasks(userId: String) {
        syncTasks(userId)
    }

    override suspend fun createTask(userId: String, title: String): Result<Task> {
        return apiService.createTask(title)
            .mapCatching { dto ->
                val task = dto.toDomain()
                taskDao.insertTask(task.toEntity())
                task
            }
    }

    override suspend fun updateTask(taskId: String, title: String?, completed: Boolean?): Result<Task> {
        return apiService.updateTask(taskId, title, completed)
            .mapCatching { dto ->
                val task = dto.toDomain()
                taskDao.insertTask(task.toEntity())
                task
            }
    }

    override suspend fun deleteTask(taskId: String): Result<Unit> {
        return apiService.deleteTask(taskId)
            .mapCatching {
                taskDao.deleteTask(taskId)
                Unit
            }
    }

    suspend fun syncTasks(userId: String) {
        apiService.getTasks().getOrNull()?.let { dtos ->
            val entities = dtos.map { it.toDomain().toEntity() }
            taskDao.insertTasks(entities)
        }
    }
}
