package com.example.cleanly.data.repository

import com.example.cleanly.data.remote.api.ApiService
import com.example.cleanly.data.remote.model.BookingDto
import com.example.cleanly.data.remote.model.CreateBookingRequest
import com.example.cleanly.data.remote.model.ServiceDto
import com.example.cleanly.domain.repository.IBookingRepository
import javax.inject.Inject

class BookingRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : IBookingRepository {
    override suspend fun getServices(): Result<List<ServiceDto>> = apiService.getServices()
    override suspend fun getBookings(): Result<List<BookingDto>> = apiService.getBookings()
    override suspend fun getBooking(id: String): Result<BookingDto> = apiService.getBooking(id)
    override suspend fun createBooking(request: CreateBookingRequest): Result<BookingDto> =
        apiService.createBooking(request)
    override suspend fun confirmBookingPayment(bookingId: String): Result<BookingDto> =
        apiService.confirmBookingPayment(bookingId)
    override suspend fun cancelBooking(bookingId: String): Result<BookingDto> =
        apiService.cancelBooking(bookingId)
}
