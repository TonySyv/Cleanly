package com.example.cleanly.ui.screen.checkout

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    onNavigateBack: () -> Unit,
    onBookingSuccess: () -> Unit,
    viewModel: CheckoutViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    when {
        uiState.paymentConfirmed -> {
            AlertDialog(
                onDismissRequest = { },
                title = { Text("Booking confirmed") },
                text = { Text("Your cleaning is booked. We'll notify providers.") },
                confirmButton = {
                    Button(onClick = onBookingSuccess) { Text("OK") }
                }
            )
        }
        else -> {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Text("Checkout") },
                        navigationIcon = {
                            TextButton(onClick = onNavigateBack) {
                                Text("Back", color = MaterialTheme.colorScheme.primary)
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.surface,
                            titleContentColor = MaterialTheme.colorScheme.onSurface
                        )
                    )
                }
            ) { padding ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    uiState.error?.let { msg ->
                        Text(msg, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    OutlinedTextField(
                        value = uiState.address,
                        onValueChange = { viewModel.setAddress(it) },
                        label = { Text("Address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = uiState.scheduledAt,
                        onValueChange = { viewModel.setScheduledAt(it) },
                        label = { Text("Date & time (ISO or leave blank for tomorrow)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    when {
                        uiState.createdBooking != null -> {
                            Text(
                                "Booking created. Total: $${uiState.createdBooking!!.totalPriceCents / 100.0}",
                                style = MaterialTheme.typography.titleMedium
                            )
                            if (uiState.createdBooking!!.clientSecret != null) {
                                Text(
                                    "Use Stripe SDK with clientSecret to complete payment, then tap Confirm.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.confirmPayment() },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(if (uiState.createdBooking!!.clientSecret != null) "Confirm payment" else "Confirm booking")
                            }
                        }
                        uiState.isLoading -> {
                            CircularProgressIndicator(modifier = Modifier.padding(24.dp))
                        }
                        else -> {
                            Button(
                                onClick = { viewModel.createBooking() },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Create booking")
                            }
                        }
                    }
                }
            }
        }
    }
}
