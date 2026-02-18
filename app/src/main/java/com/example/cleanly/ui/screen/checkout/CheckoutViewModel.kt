package com.example.cleanly.ui.screen.checkout

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.data.remote.model.CreateBookingItemRequest
import com.example.cleanly.data.remote.model.CreateBookingRequest
import com.example.cleanly.domain.usecase.address.GetAddressesUseCase
import com.example.cleanly.domain.usecase.booking.ConfirmBookingPaymentUseCase
import com.example.cleanly.domain.usecase.booking.CreateBookingUseCase
import com.example.cleanly.domain.usecase.booking.ExecutePaymentResult
import com.example.cleanly.domain.usecase.booking.ExecutePaymentUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CheckoutUiState(
    val address: String = "",
    val addresses: List<AddressDto> = emptyList(),
    val addressesLoading: Boolean = false,
    val useSavedAddress: Boolean = false,
    val selectedAddressId: String? = null,
    val addressLine1: String = "",
    val addressLine2: String = "",
    val city: String = "",
    val postalCode: String = "",
    val country: String = "",
    val customerNotes: String = "",
    val scheduledAt: String = "",
    val isLoading: Boolean = false,
    val createdBooking: BookingDto? = null,
    val paymentConfirmed: Boolean = false,
    /** When set, UI shows Stripe Payment Sheet; after success call confirmAfterStripe then clear. */
    val stripeClientSecret: String? = null,
    val error: String? = null
)

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getAddressesUseCase: GetAddressesUseCase,
    private val createBookingUseCase: CreateBookingUseCase,
    private val executePaymentUseCase: ExecutePaymentUseCase,
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

    init {
        loadAddresses()
    }

    fun loadAddresses() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(addressesLoading = true)
            getAddressesUseCase()
                .onSuccess { list ->
                    _uiState.value = _uiState.value.copy(
                        addresses = list,
                        addressesLoading = false,
                        selectedAddressId = if (list.isNotEmpty() && _uiState.value.selectedAddressId == null) list.first().id else _uiState.value.selectedAddressId
                    )
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(addressesLoading = false)
                }
        }
    }

    fun setUseSavedAddress(use: Boolean) {
        _uiState.value = _uiState.value.copy(useSavedAddress = use)
    }

    fun setSelectedAddressId(id: String?) {
        _uiState.value = _uiState.value.copy(selectedAddressId = id)
    }

    fun setAddress(value: String) {
        _uiState.value = _uiState.value.copy(address = value)
    }

    fun setAddressLine1(value: String) {
        _uiState.value = _uiState.value.copy(addressLine1 = value)
    }

    fun setAddressLine2(value: String) {
        _uiState.value = _uiState.value.copy(addressLine2 = value)
    }

    fun setCity(value: String) {
        _uiState.value = _uiState.value.copy(city = value)
    }

    fun setPostalCode(value: String) {
        _uiState.value = _uiState.value.copy(postalCode = value)
    }

    fun setCountry(value: String) {
        _uiState.value = _uiState.value.copy(country = value)
    }

    fun setCustomerNotes(value: String) {
        _uiState.value = _uiState.value.copy(customerNotes = value)
    }

    fun setScheduledAt(value: String) {
        _uiState.value = _uiState.value.copy(scheduledAt = value)
    }

    private fun formatAddressFromStructured(): String {
        val s = _uiState.value
        val parts = mutableListOf<String>()
        if (s.addressLine1.isNotBlank()) parts.add(s.addressLine1.trim())
        if (s.addressLine2.isNotBlank()) parts.add(s.addressLine2.trim())
        if (s.city.isNotBlank()) parts.add(s.city.trim())
        if (s.postalCode.isNotBlank()) parts.add(s.postalCode.trim())
        if (s.country.isNotBlank()) parts.add(s.country.trim())
        return parts.joinToString(", ")
    }

    fun createBooking() {
        if (cartItems.isEmpty()) {
            _uiState.value = _uiState.value.copy(error = "No service selected")
            return
        }
        val s = _uiState.value
        val scheduledAt = s.scheduledAt.trim()
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

        val resolved = when {
            s.useSavedAddress && s.selectedAddressId != null -> {
                val addr = s.addresses.find { it.id == s.selectedAddressId }
                if (addr == null) {
                    _uiState.value = _uiState.value.copy(error = "Select a saved address")
                    return
                }
                val display = listOfNotNull(addr.line1, addr.line2, addr.city, addr.postalCode, addr.country).filter { it.isNotBlank() }.joinToString(", ")
                AddressPayload(display, addr.id, null, null, null, null, null)
            }
            else -> {
                val line1 = s.addressLine1.trim()
                if (line1.isBlank()) {
                    _uiState.value = _uiState.value.copy(error = "Enter at least address line 1")
                    return
                }
                val formatted = formatAddressFromStructured()
                AddressPayload(
                    formatted, null,
                    line1,
                    s.addressLine2.trim().takeIf { it.isNotBlank() },
                    s.city.trim().takeIf { it.isNotBlank() },
                    s.postalCode.trim().takeIf { it.isNotBlank() },
                    s.country.trim().takeIf { it.isNotBlank() }
                )
            }
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val request = CreateBookingRequest(
                scheduledAt = scheduled,
                address = resolved.address,
                addressId = resolved.addressId,
                customerNotes = s.customerNotes.trim().takeIf { it.isNotBlank() },
                addressLine1 = resolved.addressLine1,
                addressLine2 = resolved.addressLine2,
                city = resolved.city,
                postalCode = resolved.postalCode,
                country = resolved.country,
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

    private data class AddressPayload(
        val address: String,
        val addressId: String?,
        val addressLine1: String?,
        val addressLine2: String?,
        val city: String?,
        val postalCode: String?,
        val country: String?
    )

    fun confirmPayment() {
        val booking = _uiState.value.createdBooking ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            executePaymentUseCase.execute(booking)
                .onSuccess { result ->
                    when (result) {
                        is ExecutePaymentResult.Confirmed ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                paymentConfirmed = true,
                                createdBooking = result.booking
                            )
                        is ExecutePaymentResult.RequiresStripe ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                stripeClientSecret = result.clientSecret
                            )
                    }
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Payment confirmation failed"
                    )
                }
        }
    }

    /** Call after Stripe Payment Sheet succeeds; then clear stripe client secret. */
    fun confirmAfterStripe(bookingId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, stripeClientSecret = null, error = null)
            confirmBookingPaymentUseCase(bookingId)
                .onSuccess { booking ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        paymentConfirmed = true,
                        createdBooking = booking
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

    fun clearStripeClientSecret() {
        _uiState.value = _uiState.value.copy(stripeClientSecret = null)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun getCartItems(): List<Pair<String, Int>> = cartItems
}
