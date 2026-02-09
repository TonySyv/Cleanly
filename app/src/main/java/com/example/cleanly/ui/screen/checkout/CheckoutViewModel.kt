package com.example.cleanly.ui.screen.checkout

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.data.remote.model.CreateBookingItemRequest
import com.example.cleanly.data.remote.model.CreateBookingRequest
import com.example.cleanly.domain.usecase.booking.ConfirmBookingPaymentUseCase
import com.example.cleanly.domain.usecase.booking.CreateBookingUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CheckoutUiState(
    val address: String = "",
    val scheduledAt: String = "",
    val isLoading: Boolean = false,
    val createdBooking: BookingDto? = null,
    val paymentConfirmed: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val createBookingUseCase: CreateBookingUseCase,
    private val confirmBookingPaymentUseCase: ConfirmBookingPaymentUseCase
) : ViewModel() {

    private val cartItems: List<Pair<String, Int>> = run {
        val cartStr = android.net.Uri.decode(savedStateHandle.get<String>("cart") ?: return@run emptyList())
        if (cartStr.isBlank()) return@run emptyList()
        cartStr.split(",").mapNotNull { part ->
            val kv = part.split(":")
            if (kv.size == 2) {
                val qty = kv[1].trim().toIntOrNull()?.coerceAtLeast(1) ?: 1
                kv[0].trim() to qty
            } else null
        }
    }

    private val _uiState = MutableStateFlow(CheckoutUiState())
    val uiState: StateFlow<CheckoutUiState> = _uiState.asStateFlow()

    fun setAddress(value: String) {
        _uiState.value = _uiState.value.copy(address = value)
    }

    fun setScheduledAt(value: String) {
        _uiState.value = _uiState.value.copy(scheduledAt = value)
    }

    fun createBooking() {
        if (cartItems.isEmpty()) {
            _uiState.value = _uiState.value.copy(error = "No items in cart")
            return
        }
        val address = _uiState.value.address.trim()
        val scheduledAt = _uiState.value.scheduledAt.trim()
        if (address.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Enter address")
            return
        }
        val scheduled = try {
            if (scheduledAt.isBlank()) {
                java.util.Calendar.getInstance().apply { add(java.util.Calendar.DAY_OF_MONTH, 1) }.time.toInstant().toString()
            } else scheduledAt
        } catch (_: Exception) {
            null
        } ?: run {
            _uiState.value = _uiState.value.copy(error = "Invalid date")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val request = CreateBookingRequest(
                scheduledAt = scheduled,
                address = address,
                items = cartItems.map { (id, qty) -> CreateBookingItemRequest(serviceId = id, quantity = qty) }
            )
            createBookingUseCase(request)
                .onSuccess { booking ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        createdBooking = booking,
                        error = null
                    )
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to create booking"
                    )
                }
        }
    }

    fun confirmPayment() {
        val booking = _uiState.value.createdBooking ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            confirmBookingPaymentUseCase(booking.id)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        paymentConfirmed = true,
                        createdBooking = it
                    )
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Payment confirmation failed"
                    )
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun getCartItems(): List<Pair<String, Int>> = cartItems
}
