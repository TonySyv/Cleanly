package com.example.cleanly.ui.screen.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.domain.model.User
import com.example.cleanly.domain.repository.IAuthRepository
import com.example.cleanly.domain.usecase.auth.LogoutUseCase
import com.example.cleanly.domain.usecase.user.GetUserProfileUseCase
import com.example.cleanly.domain.usecase.user.UpdateUserProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val user: User? = null,
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val isEditing: Boolean = false,
    val editedName: String = "",
    val snackbarMessage: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getUserProfileUseCase: GetUserProfileUseCase,
    private val updateUserProfileUseCase: UpdateUserProfileUseCase,
    private val authRepository: IAuthRepository,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    fun logout() {
        viewModelScope.launch {
            logoutUseCase()
        }
    }

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadUserProfile()
    }

    fun startEditing(name: String) {
        _uiState.value = _uiState.value.copy(
            isEditing = true,
            editedName = name
        )
    }

    fun updateEditedName(value: String) {
        _uiState.value = _uiState.value.copy(editedName = value)
    }

    fun cancelEditing() {
        _uiState.value = _uiState.value.copy(
            isEditing = false,
            editedName = ""
        )
    }

    fun saveName() {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUserId() ?: return@launch
            val name = _uiState.value.editedName.trim()
            if (name.isEmpty()) {
                _uiState.value = _uiState.value.copy(snackbarMessage = "Name cannot be empty")
                return@launch
            }
            updateUserProfileUseCase(userId, name, null)
                .onSuccess { user ->
                    _uiState.value = _uiState.value.copy(
                        user = user,
                        isEditing = false,
                        editedName = "",
                        snackbarMessage = "Saved"
                    )
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        snackbarMessage = it.message ?: "Failed to save"
                    )
                }
        }
    }

    fun clearSnackbar() {
        _uiState.value = _uiState.value.copy(snackbarMessage = null)
    }

    private fun loadUserProfile() {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUserId()
            if (userId != null) {
                getUserProfileUseCase(userId).collect { user ->
                    _uiState.value = _uiState.value.copy(
                        user = user,
                        isLoading = false
                    )
                }
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "User not found"
                )
            }
        }
    }
}
