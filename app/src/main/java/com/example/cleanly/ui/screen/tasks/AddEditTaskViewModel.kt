package com.example.cleanly.ui.screen.tasks

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.domain.usecase.task.CreateTaskUseCase
import com.example.cleanly.domain.usecase.task.UpdateTaskUseCase
import com.example.cleanly.domain.repository.IAuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AddEditTaskUiState(
    val title: String = "",
    val completed: Boolean = false,
    val isEditing: Boolean = false,
    val taskId: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class AddEditTaskViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val authRepository: IAuthRepository,
    private val createTaskUseCase: CreateTaskUseCase,
    private val updateTaskUseCase: UpdateTaskUseCase,
    private val getTasksUseCase: com.example.cleanly.domain.usecase.task.GetTasksUseCase
) : ViewModel() {

    private val taskId: String? = savedStateHandle.get<String>("taskId")?.takeIf { it.isNotBlank() }

    private val _uiState = MutableStateFlow(AddEditTaskUiState(
        isEditing = taskId != null,
        taskId = taskId
    ))
    val uiState: StateFlow<AddEditTaskUiState> = _uiState.asStateFlow()

    init {
        taskId?.let { loadTask(it) }
    }

    private fun loadTask(id: String) {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUserId() ?: return@launch
            _uiState.value = _uiState.value.copy(isLoading = true)
            val tasks = getTasksUseCase(userId).first()
            val task = tasks.find { it.id == id }
            _uiState.value = _uiState.value.copy(
                title = task?.title ?: "",
                completed = task?.completed ?: false,
                isLoading = false
            )
        }
    }

    fun updateTitle(value: String) {
        _uiState.value = _uiState.value.copy(title = value)
    }

    fun updateCompleted(value: Boolean) {
        _uiState.value = _uiState.value.copy(completed = value)
    }

    fun save(onSuccess: () -> Unit) {
        viewModelScope.launch {
            val title = _uiState.value.title.trim()
            if (title.isEmpty()) {
                _uiState.value = _uiState.value.copy(errorMessage = "Title cannot be empty")
                return@launch
            }
            val id = _uiState.value.taskId
            if (id != null) {
                updateTaskUseCase(id, title, _uiState.value.completed).onSuccess { onSuccess() }
            } else {
                val userId = authRepository.getCurrentUserId() ?: return@launch
                createTaskUseCase(userId, title).onSuccess { onSuccess() }
            }
        }
    }
}
