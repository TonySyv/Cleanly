package com.example.cleanly.ui.payment

import androidx.compose.runtime.compositionLocalOf
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult

/**
 * Holder for the Stripe result callback. PaymentSheet is created in MainActivity (before STARTED)
 * and its result is forwarded here so CheckoutScreen can handle it with the current ViewModel.
 */
object StripePaymentSheetHolder {
    var pendingBookingId: String? = null
    var listener: ((PaymentSheetResult, String) -> Unit)? = null

    fun onResult(result: PaymentSheetResult) {
        val bid = pendingBookingId
        val l = listener
        listener = null
        pendingBookingId = null
        bid?.let { l?.invoke(result, it) }
    }
}

val LocalPaymentSheet = compositionLocalOf<PaymentSheet?> { null }
