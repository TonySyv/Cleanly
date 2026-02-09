package com.example.cleanly.data.remote

import com.example.cleanly.BuildConfig
import com.example.cleanly.data.local.datastore.AuthDataStore
import com.example.cleanly.data.remote.model.AuthResponse
import com.example.cleanly.data.remote.model.RefreshTokenRequest
import com.example.cleanly.di.UnauthenticatedClient
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.client.plugins.auth.providers.BearerTokens
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenRefreshLoader @Inject constructor(
    private val authDataStore: AuthDataStore,
    @UnauthenticatedClient private val httpClient: HttpClient
) {
    suspend fun refresh(): BearerTokens? {
        val refreshToken = authDataStore.getRefreshToken().first() ?: return null
        if (refreshToken.isBlank()) return null
        return try {
            val response = httpClient.post("${BuildConfig.API_BASE_URL}auth/refresh") {
                contentType(ContentType.Application.Json)
                setBody(RefreshTokenRequest(refreshToken))
            }
            val authResponse = response.body<AuthResponse>()
            authDataStore.saveAuthToken(authResponse.accessToken)
            BearerTokens(authResponse.accessToken, authResponse.refreshToken)
        } catch (e: Exception) {
            null
        }
    }
}
