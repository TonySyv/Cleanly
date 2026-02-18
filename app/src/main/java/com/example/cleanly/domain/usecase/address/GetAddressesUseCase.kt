package com.example.cleanly.domain.usecase.address

import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.domain.repository.IAddressRepository
import javax.inject.Inject

class GetAddressesUseCase @Inject constructor(
    private val repository: IAddressRepository
) {
    suspend operator fun invoke(): Result<List<AddressDto>> = repository.getAddresses()
}
