package com.example.cleanly.domain.usecase.address

import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.data.remote.model.UpdateAddressRequest
import com.example.cleanly.domain.repository.IAddressRepository
import javax.inject.Inject

class UpdateAddressUseCase @Inject constructor(
    private val repository: IAddressRepository
) {
    suspend operator fun invoke(id: String, request: UpdateAddressRequest): Result<AddressDto> =
        repository.updateAddress(id, request)
}
