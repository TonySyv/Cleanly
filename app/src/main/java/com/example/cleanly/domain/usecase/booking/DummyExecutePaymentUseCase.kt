package com.example.cleanly.domain.usecase.booking

import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.domain.repository.IBookingRepository
import javax.inject.Inject

/**
 * Dummy payment execution: no Stripe SDK; just calls confirm-payment API.
 * Used when backend returns no clientSecret (PAYMENT_PROVIDER=dummy).
 */
class DummyExecutePaymentUseCase @Inject constructor(
    private val repository: IBookingRepository
) : ExecutePaymentUseCase {
    override suspend fun execute(booking: BookingDto): Result<ExecutePaymentResult> =
        repository.confirmBookingPayment(booking.id).map { ExecutePaymentResult.Confirmed(it) }
}
