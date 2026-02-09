package com.example.cleanly.domain.usecase.booking

import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.data.remote.model.CreateBookingRequest
import com.example.cleanly.domain.repository.IBookingRepository
import javax.inject.Inject

class CreateBookingUseCase @Inject constructor(
    private val repository: IBookingRepository
) {
    suspend operator fun invoke(request: CreateBookingRequest): Result<BookingDto> =
        repository.createBooking(request)
}
