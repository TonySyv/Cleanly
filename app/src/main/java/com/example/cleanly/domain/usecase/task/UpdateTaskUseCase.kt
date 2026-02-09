package com.example.cleanly.domain.usecase.task

import com.example.cleanly.domain.model.Task
import com.example.cleanly.domain.repository.ITaskRepository
import javax.inject.Inject

class UpdateTaskUseCase @Inject constructor(
    private val taskRepository: ITaskRepository
) {
    suspend operator fun invoke(taskId: String, title: String?, completed: Boolean?): Result<Task> {
        return taskRepository.updateTask(taskId, title, completed)
    }
}
