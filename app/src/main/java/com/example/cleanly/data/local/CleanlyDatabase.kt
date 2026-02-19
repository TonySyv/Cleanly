package com.example.cleanly.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.example.cleanly.data.local.dao.UserDao
import com.example.cleanly.data.local.entity.UserEntity

@Database(
    entities = [UserEntity::class],
    version = 4,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class CleanlyDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
