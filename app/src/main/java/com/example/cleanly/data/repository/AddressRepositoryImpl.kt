package com.example.cleanly.data.repository

import com.example.cleanly.data.remote.api.ApiService
import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.data.remote.model.CreateAddressRequest
import com.example.cleanly.data.remote.model.UpdateAddressRequest
import com.example.cleanly.domain.repository.IAddressRepository
import javax.inject.Inject

class AddressRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : IAddressRepository {
    override suspend fun getAddresses(): Result<List<AddressDto>> = apiService.getAddresses()
    override suspend fun createAddress(request: CreateAddressRequest): Result<AddressDto> =
        apiService.createAddress(request)
    override suspend fun updateAddress(id: String, request: UpdateAddressRequest): Result<AddressDto> =
        apiService.updateAddress(id, request)
    override suspend fun deleteAddress(id: String): Result<Unit> = apiService.deleteAddress(id)
}
