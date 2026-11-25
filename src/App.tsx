import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/public/LandingPage';
import { SearchPage } from './pages/public/SearchPage';
import { EmergencyStayPage } from './pages/public/EmergencyStayPage';
import { InterviewModePage } from './pages/public/InterviewModePage';
import { PropertyDetailPage } from './pages/public/PropertyDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { CheckoutPage } from './pages/booking/CheckoutPage';
import { CustomerLayout } from './pages/account/CustomerLayout';
import { ProfilePage } from './pages/account/ProfilePage';
import { BookingsPage } from './pages/account/BookingsPage';
import { BookingDetailPage } from './pages/account/BookingDetailPage';
import { FavoritesPage } from './pages/account/FavoritesPage';
import { NotificationsPage } from './pages/account/NotificationsPage';
import { DisputesPage, SafetyPage, SupportPage } from './pages/account/SupportDisputesSafetyPages';
import { OwnerLayout } from './pages/owner/OwnerLayout';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerPropertiesPage } from './pages/owner/OwnerPropertiesPage';
import { OwnerAvailabilityPage } from './pages/owner/OwnerAvailabilityPage';
import { OwnerBookingsPage } from './pages/owner/OwnerBookingsPage';
import { OwnerPayoutsPage, OwnerVerificationPage } from './pages/owner/OwnerFinanceAndVerificationPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPropertiesPage, AdminVerificationsPage } from './pages/admin/AdminUsersPropertiesPage';
import { AdminCouponsPage, AdminFinancePage } from './pages/admin/AdminFinanceCouponsPage';
import { AdminModerationPage } from './pages/admin/AdminModerationPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/emergency" element={<EmergencyStayPage />} />
          <Route path="/interview-mode" element={<InterviewModePage />} />
          <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<CustomerLayout />}>
              <Route index element={<Navigate to="/account/bookings" replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="disputes" element={<DisputesPage />} />
              <Route path="safety" element={<SafetyPage />} />
            </Route>
          </Route>

          {/* Property Owner routes */}
          <Route element={<ProtectedRoute allowedRoles={['PROPERTY_OWNER']} />}>
            <Route path="/owner" element={<OwnerLayout />}>
              <Route index element={<OwnerDashboardPage />} />
              <Route path="properties" element={<OwnerPropertiesPage />} />
              <Route path="availability" element={<OwnerAvailabilityPage />} />
              <Route path="bookings" element={<OwnerBookingsPage />} />
              <Route path="payouts" element={<OwnerPayoutsPage />} />
              <Route path="verification" element={<OwnerVerificationPage />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPropertiesPage />} />
              <Route path="verifications" element={<AdminVerificationsPage />} />
              <Route path="finance" element={<AdminFinancePage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
