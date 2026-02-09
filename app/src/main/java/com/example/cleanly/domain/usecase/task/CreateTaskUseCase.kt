package com.example.cleanly.domain.usecase.task

import com.example.cleanly.domain.model.Task
import com.example.cleanly.domain.repository.ITaskRepository
import javax.inject.Inject

class CreateTaskUseCase @Inject constructor(
    private val taskRepository: ITaskRepository
) {
    suspend operator fun invoke(userId: String, title: String): Result<Task> {
        return taskRepository.createTask(userId, title)
    }
}
