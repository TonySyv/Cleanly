package com.example.cleanly.domain.repository

import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.data.remote.model.CreateAddressRequest
import com.example.cleanly.data.remote.model.UpdateAddressRequest

interface IAddressRepository {
    suspend fun getAddresses(): Result<List<AddressDto>>
    suspend fun createAddress(request: CreateAddressRequest): Result<AddressDto>
    suspend fun updateAddress(id: String, request: UpdateAddressRequest): Result<AddressDto>
    suspend fun deleteAddress(id: String): Result<Unit>
}
