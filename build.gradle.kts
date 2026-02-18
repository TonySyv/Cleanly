// Top-level build file where you can add configuration options common to all sub-projects/modules.

// Require Java 17+ (AGP 8.x and Firebase Crashlytics 3.x). Fail fast with a clear message.
if (!JavaVersion.current().isCompatibleWith(JavaVersion.VERSION_17)) {
    throw GradleException(
        "This project requires Java 17 or newer. Current JVM: ${JavaVersion.current()}. " +
        "Set JAVA_HOME to a JDK 17+ installation (e.g. from https://adoptium.net/) or build from Android Studio."
    )
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.kapt) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.hilt.android) apply false
    alias(libs.plugins.google.services) apply false
    alias(libs.plugins.firebase.crashlytics) apply false
    alias(libs.plugins.compose.compiler) apply false
}