package com.example.cleanly.domain.usecase.booking

import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.domain.repository.IBookingRepository
import javax.inject.Inject

class ConfirmBookingPaymentUseCase @Inject constructor(
    private val repository: IBookingRepository
) {
    suspend operator fun invoke(bookingId: String): Result<BookingDto> =
        repository.confirmBookingPayment(bookingId)
}
