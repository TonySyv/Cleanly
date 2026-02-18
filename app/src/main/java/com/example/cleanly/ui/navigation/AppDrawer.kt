package com.example.cleanly.ui.navigation

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.cleanly.domain.model.User

@Composable
fun AppDrawerContent(
    navController: NavController,
    onClose: () -> Unit,
    currentRoute: String?,
    currentUser: User?
) {
    val isCustomer = (currentUser?.role ?: "CUSTOMER") == "CUSTOMER"

    ModalDrawerSheet(
        drawerContainerColor = MaterialTheme.colorScheme.surface,
        drawerContentColor = MaterialTheme.colorScheme.onSurface
    ) {
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Cleanly",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier
                .padding(horizontal = 28.dp)
                .padding(bottom = 8.dp)
        )
        if (isCustomer) {
            NavigationDrawerItem(
                icon = { Icon(Icons.Default.Home, contentDescription = null) },
                label = { Text("Home") },
                selected = currentRoute == Screen.Home.route,
                onClick = {
                    navController.navigate(Screen.Home.route) { launchSingleTop = true }
                    onClose()
                },
                modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
            )
            NavigationDrawerItem(
                icon = { Icon(Icons.Default.CleaningServices, contentDescription = null) },
                label = { Text("Book cleaning") },
                selected = currentRoute == Screen.Services.route,
                onClick = {
                    navController.navigate(Screen.Services.route) { launchSingleTop = true }
                    onClose()
                },
                modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
            )
            NavigationDrawerItem(
                icon = { Icon(Icons.Default.List, contentDescription = null) },
                label = { Text("My bookings") },
                selected = currentRoute == Screen.Bookings.route,
                onClick = {
                    navController.navigate(Screen.Bookings.route) { launchSingleTop = true }
                    onClose()
                },
                modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
            )
            NavigationDrawerItem(
                icon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                label = { Text("My addresses") },
                selected = currentRoute == Screen.Addresses.route,
                onClick = {
                    navController.navigate(Screen.Addresses.route) { launchSingleTop = true }
                    onClose()
                },
                modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
            )
        } else if (currentUser != null) {
            Text(
                text = "This app is for customers: book cleanings, manage addresses, view bookings. For provider or admin tasks (jobs, dashboard, settings), use the Cleanly web app.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 28.dp, vertical = 12.dp)
            )
        }
        NavigationDrawerItem(
            icon = { Icon(Icons.Default.Person, contentDescription = null) },
            label = { Text("Profile") },
            selected = currentRoute == Screen.Profile.route,
            onClick = {
                navController.navigate(Screen.Profile.route) { launchSingleTop = true }
                onClose()
            },
            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
        )
    }
}
