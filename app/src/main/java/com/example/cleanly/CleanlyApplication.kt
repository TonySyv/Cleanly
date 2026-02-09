package com.example.cleanly

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class CleanlyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
