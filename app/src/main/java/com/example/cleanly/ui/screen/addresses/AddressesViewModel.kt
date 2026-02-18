package com.example.cleanly.ui.screen.addresses

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.domain.usecase.address.DeleteAddressUseCase
import com.example.cleanly.domain.usecase.address.GetAddressesUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AddressesUiState(
    val addresses: List<AddressDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AddressesViewModel @Inject constructor(
    private val getAddressesUseCase: GetAddressesUseCase,
    private val deleteAddressUseCase: DeleteAddressUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddressesUiState())
    val uiState: StateFlow<AddressesUiState> = _uiState.asStateFlow()

    init {
        loadAddresses()
    }

    fun loadAddresses() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            getAddressesUseCase()
                .onSuccess { list ->
                    _uiState.value = _uiState.value.copy(addresses = list, isLoading = false)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Failed to load addresses"
                    )
                }
        }
    }

    fun deleteAddress(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(error = null)
            deleteAddressUseCase(id)
                .onSuccess { loadAddresses() }
                .onFailure {
                    _uiState.value = _uiState.value.copy(
                        error = it.message ?: "Failed to delete address"
                    )
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
