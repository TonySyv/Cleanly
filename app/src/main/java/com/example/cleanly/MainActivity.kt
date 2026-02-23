package com.example.cleanly

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.example.cleanly.ui.navigation.NavGraph
import com.example.cleanly.ui.payment.LocalPaymentSheet
import com.example.cleanly.ui.payment.StripePaymentSheetHolder
import com.example.cleanly.ui.theme.CleanlyTheme
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        // PaymentSheet must be created before setContent so registerForActivityResult runs before STARTED.
        val paymentSheet = PaymentSheet.Builder { result ->
            when (result) {
                is PaymentSheetResult.Completed,
                is PaymentSheetResult.Canceled,
                is PaymentSheetResult.Failed -> StripePaymentSheetHolder.onResult(result)
            }
        }.build(this)
        setContent {
            CompositionLocalProvider(LocalPaymentSheet provides paymentSheet) {
                CleanlyTheme {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        val navController = rememberNavController()
                        NavGraph(navController = navController)
                    }
                }
            }
        }
    }
}