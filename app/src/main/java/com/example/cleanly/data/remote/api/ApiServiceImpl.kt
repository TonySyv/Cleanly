package com.example.cleanly.data.remote.api

import com.example.cleanly.BuildConfig
import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.data.remote.model.AuthRequest
import com.example.cleanly.data.remote.model.AuthResponse
import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.data.remote.model.CreateAddressRequest
import com.example.cleanly.data.remote.model.CreateBookingRequest
import com.example.cleanly.data.remote.model.UpdateAddressRequest
import com.example.cleanly.data.remote.model.RefreshTokenRequest
import com.example.cleanly.data.remote.model.RegisterRequest
import com.example.cleanly.data.remote.model.ServiceDto
import com.example.cleanly.data.remote.model.UpdateUserRequest
import com.example.cleanly.data.remote.model.UserDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.ClientRequestException
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.json.Json
import kotlinx.serialization.Serializable
import javax.inject.Inject

@Serializable
data class ErrorResponse(
    val message: String,
    val code: String? = null
)

@Serializable
private data class ApiErrorBody(val error: ErrorResponse)

class ApiServiceImpl @Inject constructor(
    private val httpClient: HttpClient
) : ApiService {

    private val baseUrl = BuildConfig.API_BASE_URL

    private suspend fun parseApiErrorMessage(e: Exception): String? {
        if (e is ClientRequestException) {
            return runCatching {
                Json.decodeFromString<ApiErrorBody>(e.response.bodyAsText()).error.message
            }.getOrNull()
        }
        return null
    }

    override suspend fun login(request: AuthRequest): Result<AuthResponse> {
        return try {
            val response = httpClient.post("${baseUrl}auth/login") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Login failed"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun register(request: RegisterRequest): Result<AuthResponse> {
        return try {
            val response = httpClient.post("${baseUrl}auth/register") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Registration failed"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun getUserProfile(userId: String): Result<UserDto> {
        return try {
            val response = httpClient.get("${baseUrl}users/$userId")
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateUserProfile(
        userId: String,
        name: String?,
        avatarUrl: String?
    ): Result<UserDto> {
        return try {
            val response = httpClient.put("${baseUrl}users/$userId") {
                contentType(ContentType.Application.Json)
                setBody(UpdateUserRequest(name, avatarUrl))
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun refreshToken(refreshToken: String): Result<AuthResponse> {
        return try {
            val response = httpClient.post("${baseUrl}auth/refresh") {
                contentType(ContentType.Application.Json)
                setBody(RefreshTokenRequest(refreshToken))
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getServices(): Result<List<ServiceDto>> {
        return try {
            val response = httpClient.get("${baseUrl}services")
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getBookings(): Result<List<BookingDto>> {
        return try {
            val response = httpClient.get("${baseUrl}bookings")
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to load bookings"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun getBooking(id: String): Result<BookingDto> {
        return try {
            val response = httpClient.get("${baseUrl}bookings/$id")
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to load booking"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun createBooking(request: CreateBookingRequest): Result<BookingDto> {
        return try {
            val response = httpClient.post("${baseUrl}bookings") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to create booking"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun confirmBookingPayment(bookingId: String): Result<BookingDto> {
        return try {
            val response = httpClient.post("${baseUrl}bookings/$bookingId/confirm-payment")
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to confirm payment"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun cancelBooking(bookingId: String): Result<BookingDto> {
        return try {
            val response = httpClient.patch("${baseUrl}bookings/$bookingId/cancel")
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to cancel booking"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun getAddresses(): Result<List<AddressDto>> {
        return try {
            val response = httpClient.get("${baseUrl}addresses")
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to load addresses"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun createAddress(request: CreateAddressRequest): Result<AddressDto> {
        return try {
            val response = httpClient.post("${baseUrl}addresses") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to create address"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun updateAddress(id: String, request: UpdateAddressRequest): Result<AddressDto> {
        return try {
            val response = httpClient.patch("${baseUrl}addresses/$id") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to update address"
            Result.failure(Exception(msg))
        }
    }

    override suspend fun deleteAddress(id: String): Result<Unit> {
        return try {
            httpClient.delete("${baseUrl}addresses/$id")
            Result.success(Unit)
        } catch (e: Exception) {
            val msg = parseApiErrorMessage(e) ?: e.message ?: "Failed to delete address"
            Result.failure(Exception(msg))
        }
    }
}
