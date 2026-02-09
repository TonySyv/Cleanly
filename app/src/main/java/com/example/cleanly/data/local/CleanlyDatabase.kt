package com.example.cleanly.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.example.cleanly.data.local.dao.TaskDao
import com.example.cleanly.data.local.dao.UserDao
import com.example.cleanly.data.local.entity.TaskEntity
import com.example.cleanly.data.local.entity.UserEntity

@Database(
    entities = [UserEntity::class, TaskEntity::class],
    version = 2,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class CleanlyDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun taskDao(): TaskDao
}
