package com.example.cleanly.domain.usecase.address

import com.example.cleanly.domain.repository.IAddressRepository
import javax.inject.Inject

class DeleteAddressUseCase @Inject constructor(
    private val repository: IAddressRepository
) {
    suspend operator fun invoke(id: String): Result<Unit> = repository.deleteAddress(id)
}
