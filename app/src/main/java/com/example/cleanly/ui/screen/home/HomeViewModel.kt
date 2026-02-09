package com.example.cleanly.ui.screen.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.domain.repository.IAuthRepository
import com.example.cleanly.domain.usecase.booking.GetBookingsUseCase
import com.example.cleanly.domain.usecase.user.GetUserProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val userName: String? = null,
    val recentBookings: List<BookingDto> = emptyList(),
    val isLoading: Boolean = true
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: IAuthRepository,
    private val getUserProfileUseCase: GetUserProfileUseCase,
    private val getBookingsUseCase: GetBookingsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun refresh() {
        loadHomeData()
    }

    private fun loadHomeData() {
        viewModelScope.launch {
            val userId = authRepository.getCurrentUserId() ?: run {
                _uiState.value = _uiState.value.copy(isLoading = false)
                return@launch
            }
            getUserProfileUseCase(userId).first()?.let { user ->
                _uiState.value = _uiState.value.copy(userName = user.name)
            }
            getBookingsUseCase().getOrNull()?.let { list ->
                _uiState.value = _uiState.value.copy(
                    recentBookings = list.take(5),
                    isLoading = false
                )
            } ?: run {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
}
