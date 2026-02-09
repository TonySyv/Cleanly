package com.example.cleanly.domain.usecase.task

import com.example.cleanly.domain.repository.ITaskRepository
import javax.inject.Inject

class RefreshTasksUseCase @Inject constructor(
    private val taskRepository: ITaskRepository
) {
    suspend operator fun invoke(userId: String) {
        taskRepository.refreshTasks(userId)
    }
}
