package com.example.cleanly.data.remote.api

import com.example.cleanly.data.remote.model.AddressDto
import com.example.cleanly.data.remote.model.AuthRequest
import com.example.cleanly.data.remote.model.AuthResponse
import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.data.remote.model.CreateAddressRequest
import com.example.cleanly.data.remote.model.CreateBookingRequest
import com.example.cleanly.data.remote.model.RegisterRequest
import com.example.cleanly.data.remote.model.ServiceDto
import com.example.cleanly.data.remote.model.TaskDto
import com.example.cleanly.data.remote.model.UpdateAddressRequest
import com.example.cleanly.data.remote.model.UserDto

interface ApiService {
    suspend fun login(request: AuthRequest): Result<AuthResponse>
    suspend fun register(request: RegisterRequest): Result<AuthResponse>
    suspend fun getUserProfile(userId: String): Result<UserDto>
    suspend fun updateUserProfile(userId: String, name: String?, avatarUrl: String?): Result<UserDto>
    suspend fun refreshToken(refreshToken: String): Result<AuthResponse>
    suspend fun getTasks(): Result<List<TaskDto>>
    suspend fun createTask(title: String): Result<TaskDto>
    suspend fun updateTask(taskId: String, title: String?, completed: Boolean?): Result<TaskDto>
    suspend fun deleteTask(taskId: String): Result<Unit>

    suspend fun getServices(): Result<List<ServiceDto>>
    suspend fun getBookings(): Result<List<BookingDto>>
    suspend fun getBooking(id: String): Result<BookingDto>
    suspend fun createBooking(request: CreateBookingRequest): Result<BookingDto>
    suspend fun confirmBookingPayment(bookingId: String): Result<BookingDto>
    suspend fun cancelBooking(bookingId: String): Result<BookingDto>

    suspend fun getAddresses(): Result<List<AddressDto>>
    suspend fun createAddress(request: CreateAddressRequest): Result<AddressDto>
    suspend fun updateAddress(id: String, request: UpdateAddressRequest): Result<AddressDto>
    suspend fun deleteAddress(id: String): Result<Unit>
}
