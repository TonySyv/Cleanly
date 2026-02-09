package com.example.cleanly.domain.usecase.task

import com.example.cleanly.domain.model.Task
import com.example.cleanly.domain.repository.ITaskRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetTasksUseCase @Inject constructor(
    private val taskRepository: ITaskRepository
) {
    operator fun invoke(userId: String): Flow<List<Task>> {
        return taskRepository.getTasks(userId)
    }
}
