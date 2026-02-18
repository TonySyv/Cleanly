package com.example.cleanly.domain.usecase.booking

import com.example.cleanly.data.remote.model.BookingDto

/**
 * Result of execute(booking): either already confirmed (dummy), or requires Stripe sheet.
 */
sealed class ExecutePaymentResult {
    data class Confirmed(val booking: BookingDto) : ExecutePaymentResult()
    data class RequiresStripe(val clientSecret: String) : ExecutePaymentResult()
}

/**
 * Abstraction for executing payment on a created booking.
 * - Dummy: no SDK; calls confirm-payment API (backend marks success) -> Confirmed.
 * - When clientSecret present: returns RequiresStripe(clientSecret); UI shows Payment Sheet, then confirm-payment.
 */
interface ExecutePaymentUseCase {
    suspend fun execute(booking: BookingDto): Result<ExecutePaymentResult>
}
