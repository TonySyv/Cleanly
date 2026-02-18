package com.example.cleanly.data.remote.model

import kotlinx.serialization.Serializable

@Serializable
data class AddressDto(
    val id: String,
    val label: String,
    val line1: String,
    val line2: String? = null,
    val city: String? = null,
    val postalCode: String? = null,
    val country: String? = null
)

@Serializable
data class CreateAddressRequest(
    val label: String,
    val line1: String,
    val line2: String? = null,
    val city: String? = null,
    val postalCode: String? = null,
    val country: String? = null
)

@Serializable
data class UpdateAddressRequest(
    val label: String? = null,
    val line1: String? = null,
    val line2: String? = null,
    val city: String? = null,
    val postalCode: String? = null,
    val country: String? = null
)
