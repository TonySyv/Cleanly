package com.example.cleanly.domain.usecase.booking

import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.domain.repository.IBookingRepository
import javax.inject.Inject

/**
 * Default payment execution: when no clientSecret, confirm via API (dummy path).
 * When clientSecret present, returns RequiresStripe so UI can show Payment Sheet, then confirm-payment.
 */
class DefaultExecutePaymentUseCase @Inject constructor(
    private val repository: IBookingRepository
) : ExecutePaymentUseCase {
    override suspend fun execute(booking: BookingDto): Result<ExecutePaymentResult> {
        return if (booking.clientSecret.isNullOrBlank()) {
            repository.confirmBookingPayment(booking.id).map { ExecutePaymentResult.Confirmed(it) }
        } else {
            Result.success(ExecutePaymentResult.RequiresStripe(booking.clientSecret))
        }
    }
}
