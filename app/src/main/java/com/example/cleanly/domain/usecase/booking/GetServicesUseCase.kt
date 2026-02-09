package com.example.cleanly.domain.usecase.booking

import com.example.cleanly.data.remote.model.ServiceDto
import com.example.cleanly.domain.repository.IBookingRepository
import javax.inject.Inject

class GetServicesUseCase @Inject constructor(
    private val repository: IBookingRepository
) {
    suspend operator fun invoke(): Result<List<ServiceDto>> = repository.getServices()
}
