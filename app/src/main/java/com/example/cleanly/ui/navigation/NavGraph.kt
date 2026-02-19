package com.example.cleanly.ui.navigation

import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.example.cleanly.ui.MainViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.example.cleanly.ui.screen.auth.LoginScreen
import com.example.cleanly.ui.screen.auth.RegisterScreen
import com.example.cleanly.ui.screen.bookingdetail.BookingDetailScreen
import com.example.cleanly.ui.screen.bookings.BookingsScreen
import com.example.cleanly.ui.screen.checkout.CheckoutScreen
import com.example.cleanly.ui.screen.home.HomeScreen
import com.example.cleanly.ui.screen.addresses.AddEditAddressScreen
import com.example.cleanly.ui.screen.addresses.AddressesScreen
import com.example.cleanly.ui.screen.profile.ProfileScreen
import com.example.cleanly.ui.screen.services.ServicesScreen
import kotlinx.coroutines.launch
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material3.DrawerValue
import androidx.compose.runtime.LaunchedEffect

private fun isCustomerOnlyRoute(route: String?): Boolean {
    if (route == null) return false
    return route == Screen.Home.route ||
        route == Screen.Services.route ||
        route == Screen.Bookings.route ||
        route == Screen.Addresses.route ||
        route.startsWith("booking_detail") ||
        route.startsWith("checkout") ||
        route.startsWith("add_edit_address")
}

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
    object Addresses : Screen("addresses")
    object AddEditAddress : Screen("add_edit_address") {
        const val ADDRESS_ID_ARG = "addressId"
        fun route(addressId: String? = null) =
            if (addressId != null) "add_edit_address/$addressId" else "add_edit_address"
    }
    object BookingDetail : Screen("booking_detail") {
        const val BOOKING_ID_ARG = "bookingId"
        fun route(bookingId: String) = "booking_detail/$bookingId"
    }
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Login.route
) {
    val mainViewModel: MainViewModel = hiltViewModel()
    val currentUser by mainViewModel.currentUser.collectAsState(initial = null)

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showDrawer = currentRoute != null &&
            currentRoute != Screen.Login.route &&
            currentRoute != Screen.Register.route
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    val onOpenDrawer: () -> Unit = { scope.launch { drawerState.open() } }
    val onCloseDrawer: () -> Unit = { scope.launch { drawerState.close() } }

    LaunchedEffect(currentRoute, currentUser) {
        val user = currentUser
        if (user != null && user.role != "CUSTOMER" && isCustomerOnlyRoute(currentRoute)) {
            navController.navigate(Screen.Profile.route) {
                popUpTo(Screen.Home.route) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            if (showDrawer) {
                AppDrawerContent(
                    navController = navController,
                    onClose = onCloseDrawer,
                    currentRoute = currentRoute,
                    currentUser = currentUser
                )
            }
        },
        gesturesEnabled = showDrawer
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
                onOpenDrawer = onOpenDrawer,
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
                onOpenDrawer = onOpenDrawer,
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
                onOpenDrawer = onOpenDrawer,
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
                onOpenDrawer = onOpenDrawer,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToServices = { navController.navigate(Screen.Services.route) { launchSingleTop = true } },
                onBookingClick = { id -> navController.navigate(Screen.BookingDetail.route(id)) }
            )
        }
        composable(Screen.Addresses.route) {
            AddressesScreen(
                onOpenDrawer = onOpenDrawer,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToAddAddress = { navController.navigate(Screen.AddEditAddress.route(null)) },
                onNavigateToEditAddress = { id -> navController.navigate(Screen.AddEditAddress.route(id)) }
            )
        }
        composable(
            route = "add_edit_address/{${Screen.AddEditAddress.ADDRESS_ID_ARG}}",
            arguments = listOf(
                navArgument(Screen.AddEditAddress.ADDRESS_ID_ARG) { type = NavType.StringType }
            )
        ) {
            AddEditAddressScreen(onNavigateBack = { navController.popBackStack() })
        }
        composable("add_edit_address") {
            AddEditAddressScreen(onNavigateBack = { navController.popBackStack() })
        }
        composable(
            route = "booking_detail/{${Screen.BookingDetail.BOOKING_ID_ARG}}",
            arguments = listOf(
                navArgument(Screen.BookingDetail.BOOKING_ID_ARG) { type = NavType.StringType }
            )
        ) {
            BookingDetailScreen(
                onOpenDrawer = onOpenDrawer,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Profile.route) {
            ProfileScreen(
                onOpenDrawer = onOpenDrawer,
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = true }
                    }
                }
            )
        }
        }
    }
}
