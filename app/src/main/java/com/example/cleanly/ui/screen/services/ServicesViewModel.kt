package com.example.cleanly.ui.screen.services

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.data.remote.model.ServiceDto
import com.example.cleanly.domain.usecase.booking.GetServicesUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CartItem(
    val service: ServiceDto,
    val quantity: Int
)

data class ServicesUiState(
    val services: List<ServiceDto> = emptyList(),
    val cart: List<CartItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class ServicesViewModel @Inject constructor(
    private val getServicesUseCase: GetServicesUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ServicesUiState())
    val uiState: StateFlow<ServicesUiState> = _uiState.asStateFlow()

    init {
        loadServices()
    }

    fun loadServices() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getServicesUseCase()
                .onSuccess { list ->
                    _uiState.value = _uiState.value.copy(services = list, isLoading = false)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load services"
                    )
                }
        }
    }

    fun addToCart(service: ServiceDto, quantity: Int = 1) {
        val cart = _uiState.value.cart.toMutableList()
        val idx = cart.indexOfFirst { it.service.id == service.id }
        if (idx >= 0) {
            val newQ = (cart[idx].quantity + quantity).coerceAtLeast(1)
            if (newQ <= 0) cart.removeAt(idx) else cart[idx] = cart[idx].copy(quantity = newQ)
        } else {
            cart.add(CartItem(service, quantity.coerceAtLeast(1)))
        }
        _uiState.value = _uiState.value.copy(cart = cart)
    }

    fun removeFromCart(serviceId: String) {
        _uiState.value = _uiState.value.copy(
            cart = _uiState.value.cart.filter { it.service.id != serviceId }
        )
    }

    fun updateCartQuantity(serviceId: String, quantity: Int) {
        if (quantity < 1) {
            removeFromCart(serviceId)
            return
        }
        val cart = _uiState.value.cart.map {
            if (it.service.id == serviceId) it.copy(quantity = quantity) else it
        }
        _uiState.value = _uiState.value.copy(cart = cart)
    }

    fun clearCart() {
        _uiState.value = _uiState.value.copy(cart = emptyList())
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
