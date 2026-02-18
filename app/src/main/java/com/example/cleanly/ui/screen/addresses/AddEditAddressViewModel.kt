package com.example.cleanly.ui.screen.addresses

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.data.remote.model.CreateAddressRequest
import com.example.cleanly.data.remote.model.UpdateAddressRequest
import com.example.cleanly.domain.usecase.address.CreateAddressUseCase
import com.example.cleanly.domain.usecase.address.GetAddressesUseCase
import com.example.cleanly.domain.usecase.address.UpdateAddressUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AddEditAddressUiState(
    val isEditMode: Boolean = false,
    val label: String = "",
    val line1: String = "",
    val line2: String = "",
    val city: String = "",
    val postalCode: String = "",
    val country: String = "",
    val isLoading: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AddEditAddressViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getAddressesUseCase: GetAddressesUseCase,
    private val createAddressUseCase: CreateAddressUseCase,
    private val updateAddressUseCase: UpdateAddressUseCase
) : ViewModel() {

    private val addressId: String? = savedStateHandle.get<String>("addressId")?.takeIf { it.isNotBlank() }

    private val _uiState = MutableStateFlow(AddEditAddressUiState(isEditMode = addressId != null))
    val uiState: StateFlow<AddEditAddressUiState> = _uiState.asStateFlow()

    init {
        if (addressId != null) {
            loadAddress()
        }
    }

    private fun loadAddress() {
        val id = addressId ?: return
        viewModelScope.launch {
            getAddressesUseCase()
                .onSuccess { list ->
                    val addr = list.find { it.id == id }
                    if (addr != null) {
                        _uiState.value = _uiState.value.copy(
                            label = addr.label,
                            line1 = addr.line1,
                            line2 = addr.line2 ?: "",
                            city = addr.city ?: "",
                            postalCode = addr.postalCode ?: "",
                            country = addr.country ?: ""
                        )
                    }
                }
                .onFailure { }
        }
    }

    fun setLabel(value: String) {
        _uiState.value = _uiState.value.copy(label = value)
    }

    fun setLine1(value: String) {
        _uiState.value = _uiState.value.copy(line1 = value)
    }

    fun setLine2(value: String) {
        _uiState.value = _uiState.value.copy(line2 = value)
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

    fun save(onSaved: () -> Unit) {
        val s = _uiState.value
        val label = s.label.trim()
        val line1 = s.line1.trim()
        if (label.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Label is required")
            return
        }
        if (line1.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Address line 1 is required")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            if (addressId != null) {
                updateAddressUseCase(
                    addressId,
                    UpdateAddressRequest(
                        label = label,
                        line1 = line1,
                        line2 = s.line2.trim().takeIf { it.isNotBlank() },
                        city = s.city.trim().takeIf { it.isNotBlank() },
                        postalCode = s.postalCode.trim().takeIf { it.isNotBlank() },
                        country = s.country.trim().takeIf { it.isNotBlank() }
                    )
                )
                    .onSuccess {
                        _uiState.value = _uiState.value.copy(isLoading = false, saveSuccess = true)
                        onSaved()
                    }
                    .onFailure {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = it.message ?: "Failed to update address"
                        )
                    }
            } else {
                createAddressUseCase(
                    CreateAddressRequest(
                        label = label,
                        line1 = line1,
                        line2 = s.line2.trim().takeIf { it.isNotBlank() },
                        city = s.city.trim().takeIf { it.isNotBlank() },
                        postalCode = s.postalCode.trim().takeIf { it.isNotBlank() },
                        country = s.country.trim().takeIf { it.isNotBlank() }
                    )
                )
                    .onSuccess {
                        _uiState.value = _uiState.value.copy(isLoading = false, saveSuccess = true)
                        onSaved()
                    }
                    .onFailure {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = it.message ?: "Failed to create address"
                        )
                    }
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
