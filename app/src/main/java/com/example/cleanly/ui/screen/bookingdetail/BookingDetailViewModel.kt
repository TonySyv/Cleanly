package com.example.cleanly.ui.screen.bookingdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.ui.navigation.Screen
import com.example.cleanly.domain.usecase.booking.CancelBookingUseCase
import com.example.cleanly.domain.usecase.booking.GetBookingUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BookingDetailUiState(
    val isLoading: Boolean = true,
    val booking: BookingDto? = null,
    val error: String? = null
)

@HiltViewModel
class BookingDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getBookingUseCase: GetBookingUseCase,
    private val cancelBookingUseCase: CancelBookingUseCase
) : ViewModel() {

    private val bookingId: String = savedStateHandle.get<String>(Screen.BookingDetail.BOOKING_ID_ARG) ?: ""

    private val _uiState = MutableStateFlow(BookingDetailUiState())
    val uiState: StateFlow<BookingDetailUiState> = _uiState.asStateFlow()

    init {
        loadBooking()
    }

    private fun loadBooking() {
        if (bookingId.isBlank()) {
            _uiState.value = _uiState.value.copy(isLoading = false, booking = null)
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getBookingUseCase(bookingId)
                .onSuccess { booking ->
                    _uiState.value = _uiState.value.copy(booking = booking, isLoading = false)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load booking"
                    )
                }
        }
    }

    fun cancelBooking() {
        if (bookingId.isBlank()) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            cancelBookingUseCase(bookingId)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(booking = it, isLoading = false)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to cancel"
                    )
                }
        }
    }
}
