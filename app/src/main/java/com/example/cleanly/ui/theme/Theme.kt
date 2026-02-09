package com.example.cleanly.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val CleanlyDarkColorScheme = darkColorScheme(
    primary = AccentCyan,
    onPrimary = BackgroundDark,
    primaryContainer = AccentCyanVariant,
    onPrimaryContainer = OnBackgroundDark,
    secondary = SurfaceVariantDark,
    onSecondary = OnSurfaceDark,
    tertiary = SurfaceVariantDark,
    onTertiary = OnSurfaceVariantDark,
    background = BackgroundDark,
    onBackground = OnBackgroundDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    outline = OutlineDark,
    error = ErrorDark,
    onError = OnBackgroundDark
)

@Composable
fun CleanlyTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = CleanlyDarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
