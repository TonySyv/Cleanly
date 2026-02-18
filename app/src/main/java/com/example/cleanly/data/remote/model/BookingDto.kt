package com.example.cleanly.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class BookingItemDto(
    val id: String,
    val serviceId: String,
    val serviceName: String? = null,
    val quantity: Int,
    val priceCents: Int
)

@Serializable
data class BookingDto(
    val id: String,
    val customerId: String,
    val status: String,
    val scheduledAt: String,
    val address: String,
    val addressId: String? = null,
    val customerNotes: String? = null,
    val totalPriceCents: Int,
    val stripePaymentIntentId: String? = null,
    val clientSecret: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val items: List<BookingItemDto> = emptyList(),
    val job: BookingJobDto? = null
)

@Serializable
data class BookingJobDto(
    val id: String,
    val status: String,
    val providerId: String,
    val assignedEmployeeId: String? = null
)

@Serializable
data class CreateBookingRequest(
    val scheduledAt: String,
    val address: String = "",
    val addressId: String? = null,
    val customerNotes: String? = null,
    val addressLine1: String? = null,
    val addressLine2: String? = null,
    val city: String? = null,
    val postalCode: String? = null,
    val country: String? = null,
    val items: List<CreateBookingItemRequest>
)

@Serializable
data class CreateBookingItemRequest(
    val serviceId: String,
    val quantity: Int = 1
)
