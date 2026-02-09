package com.example.cleanly.domain.model

data class BookingItem(
    val id: String,
    val serviceId: String,
    val serviceName: String?,
    val quantity: Int,
    val priceCents: Int
)

data class Booking(
    val id: String,
    val customerId: String,
    val status: String,
    val scheduledAt: String,
    val address: String,
    val totalPriceCents: Int,
    val clientSecret: String?,
    val items: List<BookingItem>,
    val job: BookingJob?
)

data class BookingJob(
    val id: String,
    val status: String,
    val providerId: String,
    val assignedEmployeeId: String?
)
