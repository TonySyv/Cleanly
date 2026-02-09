package com.example.cleanly.domain.repository

import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.data.remote.model.CreateBookingRequest
import com.example.cleanly.data.remote.model.ServiceDto

interface IBookingRepository {
    suspend fun getServices(): Result<List<ServiceDto>>
    suspend fun getBookings(): Result<List<BookingDto>>
    suspend fun getBooking(id: String): Result<BookingDto>
    suspend fun createBooking(request: CreateBookingRequest): Result<BookingDto>
    suspend fun confirmBookingPayment(bookingId: String): Result<BookingDto>
    suspend fun cancelBooking(bookingId: String): Result<BookingDto>
}
