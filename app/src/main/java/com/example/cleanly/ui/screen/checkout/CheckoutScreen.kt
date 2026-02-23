package com.example.cleanly.ui.screen.checkout

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.cleanly.ui.payment.LocalPaymentSheet
import com.example.cleanly.ui.payment.StripePaymentSheetHolder
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult
import java.time.Instant
import java.time.ZoneId

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    onOpenDrawer: () -> Unit,
    onNavigateBack: () -> Unit,
    onBookingSuccess: () -> Unit,
    viewModel: CheckoutViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val paymentSheet = LocalPaymentSheet.current

    // When backend returns clientSecret, present Stripe Payment Sheet once; on success confirm with backend.
    LaunchedEffect(uiState.stripeClientSecret) {
        val clientSecret = uiState.stripeClientSecret ?: return@LaunchedEffect
        val sheet = paymentSheet ?: return@LaunchedEffect
        val booking = uiState.createdBooking ?: return@LaunchedEffect
        viewModel.clearStripeClientSecret() // clear so this effect does not re-run
        StripePaymentSheetHolder.pendingBookingId = booking.id
        StripePaymentSheetHolder.listener = { result, bookingId ->
            if (result is PaymentSheetResult.Completed) {
                viewModel.confirmAfterStripe(bookingId)
            }
        }
        val config = PaymentSheet.Configuration(
            merchantDisplayName = "Cleanly"
        )
        sheet.presentWithPaymentIntent(clientSecret, config)
    }

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
                        ),
                        actions = {
                            IconButton(onClick = onOpenDrawer) {
                                Icon(Icons.Default.Menu, contentDescription = "Menu")
                            }
                        }
                    )
                }
            ) { padding ->
                var showDatePicker by remember { mutableStateOf(false) }
                val datePickerState = rememberDatePickerState()
                val scrollState = rememberScrollState()
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(scrollState)
                        .padding(16.dp)
                ) {
                    uiState.error?.let { msg ->
                        Text(msg, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    Text("Address", style = MaterialTheme.typography.titleSmall)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = uiState.useSavedAddress,
                                onClick = { viewModel.setUseSavedAddress(true) }
                            )
                            Text("Saved address", modifier = Modifier.padding(start = 4.dp))
                        }
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = !uiState.useSavedAddress,
                                onClick = { viewModel.setUseSavedAddress(false) }
                            )
                            Text("Enter address", modifier = Modifier.padding(start = 4.dp))
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    if (uiState.useSavedAddress) {
                        if (uiState.addressesLoading) {
                            Text("Loading addresses…", style = MaterialTheme.typography.bodySmall)
                        } else if (uiState.addresses.isEmpty()) {
                            Text("No saved addresses. Add one in My addresses.", style = MaterialTheme.typography.bodySmall)
                        } else {
                            val options = uiState.addresses
                            Text(
                                "Select:",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                options.forEach { addr ->
                                    FilterChip(
                                        selected = uiState.selectedAddressId == addr.id,
                                        onClick = { viewModel.setSelectedAddressId(addr.id) },
                                        label = {
                                            Text(
                                                listOfNotNull(addr.label, addr.line1).filter { it.isNotBlank() }.joinToString(" – ")
                                            )
                                        }
                                    )
                                }
                            }
                        }
                    } else {
                        OutlinedTextField(
                            value = uiState.addressLine1,
                            onValueChange = { viewModel.setAddressLine1(it) },
                            label = { Text("Address line 1") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = uiState.addressLine2,
                            onValueChange = { viewModel.setAddressLine2(it) },
                            label = { Text("Address line 2 (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = uiState.city,
                                onValueChange = { viewModel.setCity(it) },
                                label = { Text("City") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = uiState.postalCode,
                                onValueChange = { viewModel.setPostalCode(it) },
                                label = { Text("Postal code") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = uiState.country,
                            onValueChange = { viewModel.setCountry(it) },
                            label = { Text("Country") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = uiState.customerNotes,
                        onValueChange = { viewModel.setCustomerNotes(it) },
                        label = { Text("Special instructions (e.g. access, pets, areas to focus)") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        maxLines = 4
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = uiState.scheduledAt,
                            onValueChange = { viewModel.setScheduledAt(it) },
                            label = { Text("Date & time") },
                            placeholder = { Text("e.g. 2025-02-18T10:00:00 or leave blank for tomorrow") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        FilledTonalButton(onClick = { showDatePicker = true }) {
                            Icon(Icons.Default.CalendarMonth, contentDescription = "Pick date")
                        }
                    }
                    if (showDatePicker) {
                        DatePickerDialog(
                            onDismissRequest = { showDatePicker = false },
                            confirmButton = {
                                TextButton(
                                    onClick = {
                                        datePickerState.selectedDateMillis?.let { millis ->
                                            val zoned = Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault())
                                            val instant = zoned.toLocalDate().atTime(10, 0)
                                                .atZone(ZoneId.systemDefault())
                                                .toInstant()
                                            viewModel.setScheduledAt(instant.toString())
                                        }
                                        showDatePicker = false
                                    }
                                ) {
                                    Text("OK")
                                }
                            }
                        ) {
                            DatePicker(state = datePickerState)
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                    when {
                        uiState.createdBooking != null -> {
                            val booking = uiState.createdBooking!!
                            Text(
                                "Booking created. Total: $${booking.totalPriceCents / 100.0}",
                                style = MaterialTheme.typography.titleMedium
                            )
                            if (booking.clientSecret != null) {
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
                                Text(if (booking.clientSecret != null) "Confirm payment" else "Confirm booking")
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
