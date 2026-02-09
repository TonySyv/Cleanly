package com.example.cleanly.ui.screen.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.domain.model.Task
import com.example.cleanly.domain.repository.IAuthRepository
import com.example.cleanly.domain.usecase.task.CreateTaskUseCase
import com.example.cleanly.domain.usecase.task.DeleteTaskUseCase
import com.example.cleanly.domain.usecase.task.GetTasksUseCase
import com.example.cleanly.domain.usecase.task.RefreshTasksUseCase
import com.example.cleanly.domain.usecase.task.UpdateTaskUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TasksUiState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = true,
    val errorMessage: String? = null
)

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val authRepository: IAuthRepository,
    private val getTasksUseCase: GetTasksUseCase,
    private val refreshTasksUseCase: RefreshTasksUseCase,
    private val createTaskUseCase: CreateTaskUseCase,
    private val updateTaskUseCase: UpdateTaskUseCase,
    private val deleteTaskUseCase: DeleteTaskUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()

    init {
        loadTasks()
    }

    private fun loadTasks() {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUserId() ?: return@launch
            refreshTasksUseCase(userId)
            getTasksUseCase(userId)
                .catch { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = e.message
                    )
                }
                .collect { tasks ->
                    _uiState.value = _uiState.value.copy(
                        tasks = tasks,
                        isLoading = false,
                        errorMessage = null
                    )
                }
        }
    }

    fun toggleCompleted(task: Task) {
        viewModelScope.launch {
            updateTaskUseCase(task.id, null, !task.completed)
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            deleteTaskUseCase(taskId)
        }
    }

    fun createTask(title: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUserId() ?: return@launch
            if (title.isBlank()) return@launch
            createTaskUseCase(userId, title.trim()).onSuccess { onSuccess() }
        }
    }

    fun updateTask(taskId: String, title: String?, completed: Boolean?) {
        viewModelScope.launch {
            updateTaskUseCase(taskId, title, completed)
        }
    }
}
