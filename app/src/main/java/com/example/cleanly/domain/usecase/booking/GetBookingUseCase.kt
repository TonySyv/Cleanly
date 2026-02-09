package com.example.cleanly.domain.usecase.booking

import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.domain.repository.IBookingRepository
import javax.inject.Inject

class GetBookingUseCase @Inject constructor(
    private val repository: IBookingRepository
) {
    suspend operator fun invoke(id: String): Result<BookingDto> = repository.getBooking(id)
}
