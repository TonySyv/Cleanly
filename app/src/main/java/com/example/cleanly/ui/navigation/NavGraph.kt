package com.example.cleanly.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.cleanly.ui.screen.auth.LoginScreen
import com.example.cleanly.ui.screen.auth.RegisterScreen
import com.example.cleanly.ui.screen.bookingdetail.BookingDetailScreen
import com.example.cleanly.ui.screen.bookings.BookingsScreen
import com.example.cleanly.ui.screen.checkout.CheckoutScreen
import com.example.cleanly.ui.screen.home.HomeScreen
import com.example.cleanly.ui.screen.profile.ProfileScreen
import com.example.cleanly.ui.screen.services.ServicesScreen
import com.example.cleanly.ui.screen.tasks.AddEditTaskScreen
import com.example.cleanly.ui.screen.tasks.TasksScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Profile : Screen("profile")
    object Services : Screen("services")
    object Checkout : Screen("checkout") {
        const val CART_ARG = "cart"
        fun route(cart: String) = "checkout/${android.net.Uri.encode(cart)}"
    }
    object Bookings : Screen("bookings")
    object BookingDetail : Screen("booking_detail") {
        const val BOOKING_ID_ARG = "bookingId"
        fun route(bookingId: String) = "booking_detail/$bookingId"
    }
    object Tasks : Screen("tasks")
    object AddEditTask : Screen("add_edit_task") {
        const val TASK_ID_ARG = "taskId"
        fun route(taskId: String? = null) =
            if (taskId != null) "add_edit_task/$taskId" else "add_edit_task"
    }
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Login.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Register.route) {
            RegisterScreen(
                onNavigateToLogin = { navController.popBackStack() },
                onRegisterSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
                onNavigateToServices = { navController.navigate(Screen.Services.route) },
                onNavigateToBookings = { navController.navigate(Screen.Bookings.route) },
                onNavigateToBookingDetail = { id ->
                    navController.navigate(Screen.BookingDetail.route(id))
                }
            )
        }
        composable(Screen.Services.route) {
            ServicesScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToCheckout = { cartStr ->
                    navController.navigate(Screen.Checkout.route(cartStr))
                }
            )
        }
        composable(
            route = "checkout/{${Screen.Checkout.CART_ARG}}",
            arguments = listOf(
                navArgument(Screen.Checkout.CART_ARG) {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = ""
                }
            )
        ) {
            CheckoutScreen(
                onNavigateBack = { navController.popBackStack() },
                onBookingSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Services.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Bookings.route) {
            BookingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onBookingClick = { id -> navController.navigate(Screen.BookingDetail.route(id)) }
            )
        }
        composable(
            route = "booking_detail/{${Screen.BookingDetail.BOOKING_ID_ARG}}",
            arguments = listOf(
                navArgument(Screen.BookingDetail.BOOKING_ID_ARG) { type = NavType.StringType }
            )
        ) {
            BookingDetailScreen(onNavigateBack = { navController.popBackStack() })
        }
        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Tasks.route) {
            TasksScreen(
                onNavigateBack = { navController.popBackStack() },
                onAddTask = { navController.navigate(Screen.AddEditTask.route(null)) },
                onEditTask = { taskId -> navController.navigate(Screen.AddEditTask.route(taskId)) }
            )
        }
        composable(
            route = "add_edit_task/{${Screen.AddEditTask.TASK_ID_ARG}}",
            arguments = listOf(
                navArgument(Screen.AddEditTask.TASK_ID_ARG) { type = NavType.StringType }
            )
        ) {
            AddEditTaskScreen(onNavigateBack = { navController.popBackStack() })
        }
        composable("add_edit_task") {
            AddEditTaskScreen(onNavigateBack = { navController.popBackStack() })
        }
    }
}
