# Spatial Stay — Backend API Coverage & Route Matrix

Every endpoint below was inspected directly from `src/main/java/com/accommodation/platform/**/controller/*.java`.

## 1. Authentication (`/api/v1/auth`)

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `POST /api/v1/auth/register` | Register customer or owner | Public | `fullName, email, password, phoneNumber, role, gender?` | `AuthResponse` (`accessToken, refreshToken, expiresInMs, user, verificationToken`) | `RegisterPage` (`/register`) |
| `POST /api/v1/auth/login` | Email + password login | Public | `email, password` | `AuthResponse` | `LoginPage` (`/login`) |
| `POST /api/v1/auth/refresh` | Rotate refresh token | Public | `refreshToken` | `AuthResponse` | `apiClient` automatic 401 refresh |
| `POST /api/v1/auth/logout` | Revoke refresh token | Authenticated | `refreshToken` | `ApiResponse<Void>` | `Navbar` / `AuthContext.logout` |
| `POST /api/v1/auth/forgot-password` | Request password reset token | Public | `email` | `TokenMessageResponse` | `ForgotPasswordPage` (`/forgot-password`) |
| `POST /api/v1/auth/reset-password` | Reset password with token | Public | `token, newPassword` | `ApiResponse<Void>` | `ResetPasswordPage` (`/reset-password`) |
| `POST /api/v1/auth/verify-email` | Verify email with token | Public | `token` | `ApiResponse<Void>` | `VerifyEmailPage` (`/verify-email`) |

## 2. User Profile, Bookings & Favorites (`/api/v1/users`)

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `GET /api/v1/users/me` | Get current user profile | Authenticated | — | `UserProfileResponse` | `AccountProfilePage` (`/account/profile`) |
| `PUT /api/v1/users/me` | Update profile | Authenticated | `fullName, phoneNumber, gender?, profileImage?` | `UserProfileResponse` | `AccountProfilePage` (`/account/profile`) |
| `GET /api/v1/users/me/bookings` | Paginated booking history | Authenticated | `page, size` | `PagedResponse<BookingResponse>` | `CustomerBookingsPage` (`/account/bookings`) |
| `GET /api/v1/users/me/favorites` | List saved favorites | Authenticated | `page, size` | `PagedResponse<FavoriteResponse>` | `FavoritesPage` (`/account/favorites`) |
| `POST /api/v1/users/me/favorites/{propertyId}` | Save favorite | Authenticated | `propertyId` | `FavoriteResponse` | `PropertyDetailPage` (`/properties/:id`) |
| `DELETE /api/v1/users/me/favorites/{propertyId}` | Remove favorite | Authenticated | `propertyId` | `ApiResponse<Void>` | `PropertyDetailPage`, `FavoritesPage` |

## 3. Public Properties, Search, Emergency & Interview Mode (`/api/v1/properties`)

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `GET /api/v1/properties` | Search & filter properties | Public | `city, locality, pincode, latitude, longitude, radiusKm, checkIn, checkOut, stayType, minPrice, maxPrice, propertyType, roomType, genderPolicy, amenities, minRating, verifiedOnly, availableOnly, sortBy, page, size` | `PagedResponse<PropertySearchItemResponse>` | `SearchPage` (`/search`), `LandingPage` |
| `GET /api/v1/properties/{propertyId}` | Approved property details | Public | `propertyId` | `PropertyDetailResponse` | `PropertyDetailPage` (`/properties/:id`) |
| `GET /api/v1/properties/{propertyId}/availability` | Check bed availability | Public | `checkIn, checkOut` | `PropertyAvailabilityResponse` | `InteractiveBedSelector` on `PropertyDetailPage` |
| `GET /api/v1/properties/{propertyId}/rooms` | List rooms and beds | Public | `propertyId` | `List<RoomResponse>` | `PropertyDetailPage` (`/properties/:id`) |
| `GET /api/v1/properties/{propertyId}/reviews` | List property reviews | Public | `page, size` | `PagedResponse<ReviewResponse>` | `PropertyDetailPage` (`/properties/:id`) |
| `GET /api/v1/properties/emergency` | Emergency / late-night stays | Public | `city, latitude, longitude, radiusKm, checkIn, checkOut, maxBudget, genderPolicy, page, size` | `PagedResponse<PropertySearchItemResponse>` | `EmergencyStayPage` (`/emergency`) |
| `GET /api/v1/properties/interview-mode` | Nearby interview stays + travel time | Public | `interviewLat, interviewLon, radiusKm, checkIn, checkOut, maxBudget, genderPolicy` | `List<InterviewModeResult>` | `InterviewModePage` (`/interview-mode`) |

## 4. Bookings, Modifications, Check-In & Failures (`/api/v1/bookings`)

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `POST /api/v1/bookings` | Create booking | Authenticated | `CreateBookingRequest` | `BookingResponse` | `CheckoutPage` (`/checkout`) |
| `GET /api/v1/bookings` | List user bookings | Authenticated | `page, size` | `PagedResponse<BookingResponse>` | `CustomerBookingsPage` (`/account/bookings`) |
| `GET /api/v1/bookings/{bookingId}` | Get booking details | Owner/Customer/Admin | `bookingId` | `BookingResponse` | `BookingDetailPage` (`/account/bookings/:id`) |
| `GET /api/v1/bookings/{bookingId}/status` | Poll booking status | Owner/Customer/Admin | `bookingId` | `BookingStatusResponse` | `BookingDetailPage`, `CheckoutPage` |
| `POST /api/v1/bookings/{bookingId}/confirm` | Confirm paid booking | Owner/Customer/Admin | `bookingId` | `BookingResponse` | `BookingDetailPage`, `CheckoutPage` |
| `POST /api/v1/bookings/{bookingId}/cancel` | Cancel & calculate refund | Customer/Admin | `reason?` | `BookingResponse` | `BookingDetailPage` |
| `PUT /api/v1/bookings/{bookingId}` | Modify dates or bed | Customer/Admin | `newCheckIn, newCheckOut, newBedId?` | `BookingResponse` | `BookingDetailPage` |
| `POST /api/v1/bookings/{bookingId}/extend` | Extend stay check-out | Customer | `newCheckOut` | `BookingResponse` | `BookingDetailPage` |
| `POST /api/v1/bookings/{bookingId}/transition-long-stay` | Request short-to-long transition | Customer | `newCheckOut` | `BookingResponse` | `BookingDetailPage` |
| `GET /api/v1/bookings/{bookingId}/history` | Booking status history | Authenticated | `bookingId` | `List<BookingStatusHistory>` | `BookingDetailPage` |
| `POST /api/v1/bookings/{bookingId}/checkin/confirm` | Customer confirms check-in | Customer | `bookingId` | `CheckInRecord` | `BookingDetailPage` |
| `POST /api/v1/bookings/{bookingId}/failure` | Report arrival fulfillment issue | Customer/Owner | `failureReason, description?` | `FailureWithAlternativesResponse` | `BookingDetailPage` |
| `POST /api/v1/bookings/failures/{failureId}/respond` | Accept alternative or get refund | Customer | `accepted, alternativePropertyId?, alternativeBedId?` | `BookingFailure` | `BookingDetailPage` |

## 5. Payments, Rent, Deposits & Reviews

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `POST /api/v1/payments/initiate` | Initiate payment order | Authenticated | `bookingId, paymentMethod, idempotencyKey?` | `PaymentResponse` | `CheckoutPage` (`/checkout`) |
| `GET /api/v1/payments/{paymentId}` | Get payment status | Owner/Customer/Admin | `paymentId` | `PaymentResponse` | `CheckoutPage`, `BookingDetailPage` |
| `POST /api/v1/payments/{paymentId}/verify` | Verify payment with provider | Authenticated | `providerTransactionId, signature?, simulateFailure, failureReason?` | `PaymentResponse` | `CheckoutPage` (`/checkout`) |
| `POST /api/v1/payments/{paymentId}/refund` | Full or partial refund | Customer/Admin | `amount?, reason?` | `PaymentResponse` | `BookingDetailPage`, `AdminFinancePage` |
| `POST /api/v1/payments/webhook` | Provider webhook (server-to-server) | Public (Signed) | `WebhookPayload` | `PaymentResponse` | Server-to-server (documented) |
| `POST /api/v1/rent/bookings/{bookingId}/schedule` | Generate rent schedule | Authenticated | `bookingId` | `List<RentSchedule>` | `BookingDetailPage` |
| `GET /api/v1/rent/bookings/{bookingId}/schedule` | View rent schedule | Authenticated | `bookingId` | `List<RentSchedule>` | `BookingDetailPage`, `RentPage` (`/account/rent`) |
| `POST /api/v1/rent/schedules/{scheduleId}/pay` | Pay rent installment | Customer/Owner | `amount` | `RentPayment` | `BookingDetailPage`, `RentPage` |
| `GET /api/v1/deposits/bookings/{bookingId}` | Get security deposit | Authenticated | `bookingId` | `SecurityDeposit` | `BookingDetailPage` |
| `POST /api/v1/deposits/bookings/{bookingId}/request-refund` | Request deposit refund | Customer | `bookingId` | `SecurityDeposit` | `BookingDetailPage` |
| `POST /api/v1/deposits/bookings/{bookingId}/dispute` | Dispute deposit deduction | Customer | `bookingId` | `SecurityDeposit` | `BookingDetailPage` |
| `POST /api/v1/reviews` | Submit review (completed stay) | Customer | `bookingId, rating, comment?` | `ReviewResponse` | `BookingDetailPage` |
| `PUT /api/v1/reviews/{reviewId}` | Update own review | Customer | `rating, comment?` | `ReviewResponse` | `PropertyDetailPage` |
| `DELETE /api/v1/reviews/{reviewId}` | Delete review | Customer/Admin | `reviewId` | `ApiResponse<Void>` | `PropertyDetailPage`, `AdminDashboard` |

## 6. Notifications, Support, Disputes & Safety

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `GET /api/v1/notifications` | List notifications | Authenticated | `page, size` | `PagedResponse<NotificationResponse>` | `NotificationsPage` (`/account/notifications`) |
| `POST /api/v1/notifications/{notificationId}/read` | Mark notification read | Authenticated | `notificationId` | `ApiResponse<Void>` | `NotificationsPage` |
| `POST /api/v1/support/tickets` | Create support ticket | Authenticated | `bookingId?, category, subject, message` | `SupportTicket` | `SupportPage` (`/account/support`) |
| `GET /api/v1/support/tickets` | List my tickets | Authenticated | `page, size` | `PagedResponse<SupportTicket>` | `SupportPage` (`/account/support`) |
| `POST /api/v1/support/tickets/{ticketId}/messages` | Reply on ticket | Authenticated/Admin | `message` | `SupportMessage` | `SupportPage`, `AdminSupportPage` |
| `GET /api/v1/support/tickets/{ticketId}/messages` | View ticket thread | Authenticated/Admin | `ticketId` | `List<SupportMessage>` | `SupportPage`, `AdminSupportPage` |
| `POST /api/v1/disputes` | Raise booking dispute | Customer | `bookingId, category, description, evidenceReferences?` | `BookingDispute` | `DisputesPage` (`/account/disputes`) |
| `GET /api/v1/disputes` | List my disputes | Customer | `page, size` | `PagedResponse<BookingDispute>` | `DisputesPage` (`/account/disputes`) |
| `POST /api/v1/safety/complaints` | Submit private safety complaint | Authenticated | `propertyId, bookingId?, category, description, evidenceReferences?` | `SafetyComplaint` | `SafetyPage` (`/account/safety`) |

## 7. Property Owner Operations (`/api/v1/owner`)

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `GET /api/v1/owner/dashboard` | Owner metrics & upcoming check-ins | `PROPERTY_OWNER` | — | `OwnerDashboardResponse` | `OwnerDashboardPage` (`/owner`) |
| `GET /api/v1/owner/analytics` | Owner booking & revenue analytics | `PROPERTY_OWNER` | — | `OwnerAnalyticsResponse` | `OwnerDashboardPage` (`/owner`) |
| `POST /api/v1/owner/properties` | Create property listing | `PROPERTY_OWNER` | `CreatePropertyRequest` | `PropertyDetailResponse` | `OwnerPropertiesPage` (`/owner/properties`) |
| `PUT /api/v1/owner/properties/{propertyId}` | Update property listing | `PROPERTY_OWNER` | `UpdatePropertyRequest` | `PropertyDetailResponse` | `OwnerPropertiesPage` (`/owner/properties`) |
| `POST /api/v1/owner/properties/{propertyId}/rooms` | Add room & beds | `PROPERTY_OWNER` | `CreateRoomRequest` | `RoomResponse` | `OwnerPropertiesPage` (`/owner/properties`) |
| `POST /api/v1/owner/properties/{propertyId}/beds` | Add bed to room | `PROPERTY_OWNER` | `roomId, bedNumber` | `BedResponse` | `OwnerPropertiesPage` (`/owner/properties`) |
| `PUT /api/v1/owner/properties/{propertyId}/availability` | Set bed status | `PROPERTY_OWNER` | `bedId, status` | `BedResponse` | `OwnerAvailabilityPage` (`/owner/availability`) |
| `POST /api/v1/owner/availability-blocks` | Block bed dates | `PROPERTY_OWNER` | `bedId, blockType, startTime, endTime, reason?` | `AvailabilityBlockResponse` | `OwnerAvailabilityPage` (`/owner/availability`) |
| `GET /api/v1/owner/availability-blocks/bed/{bedId}` | List blocks for bed | `PROPERTY_OWNER` | `bedId` | `List<AvailabilityBlockResponse>` | `OwnerAvailabilityPage` (`/owner/availability`) |
| `DELETE /api/v1/owner/availability-blocks/{blockId}` | Remove bed block | `PROPERTY_OWNER` | `blockId` | `ApiResponse<Void>` | `OwnerAvailabilityPage` (`/owner/availability`) |
| `GET /api/v1/owner/bookings` | List owner bookings | `PROPERTY_OWNER` | `status?, page, size` | `PagedResponse<BookingResponse>` | `OwnerBookingsPage` (`/owner/bookings`) |
| `POST /api/v1/owner/bookings/{bookingId}/approve` | Approve booking request | `PROPERTY_OWNER` | `bookingId` | `BookingResponse` | `OwnerBookingsPage` |
| `POST /api/v1/owner/bookings/{bookingId}/reject` | Reject booking request | `PROPERTY_OWNER` | `reason` | `BookingResponse` | `OwnerBookingsPage` |
| `POST /api/v1/owner/bookings/walk-in` | Create walk-in booking | `PROPERTY_OWNER` | `WalkInBookingRequest` | `BookingResponse` | `OwnerBookingsPage` |
| `POST /api/v1/owner/bookings/{bookingId}/checkin` | Record check-in | `PROPERTY_OWNER` | `notes?` | `CheckInRecord` | `OwnerBookingsPage` |
| `POST /api/v1/owner/bookings/{bookingId}/checkout` | Record check-out | `PROPERTY_OWNER` | `lateFee?, notes?` | `CheckOutRecord` | `OwnerBookingsPage` |
| `POST /api/v1/owner/bookings/{bookingId}/no-show` | Mark no-show | `PROPERTY_OWNER` | `notes?` | `ApiResponse<Void>` | `OwnerBookingsPage` |
| `POST /api/v1/owner/deposits/bookings/{bookingId}/settle` | Settle security deposit | `PROPERTY_OWNER` | `deduction?, reason?` | `SecurityDeposit` | `OwnerBookingsPage` |
| `POST /api/v1/owner/verifications` | Submit owner KYC | `PROPERTY_OWNER` | `ownerName, contactDetails, documentType, documentReference` | `OwnerVerificationResponse` | `OwnerVerificationPage` (`/owner/verification`) |
| `GET /api/v1/owner/verifications` | View owner KYC status | `PROPERTY_OWNER` | — | `List<OwnerVerificationResponse>` | `OwnerVerificationPage` (`/owner/verification`) |
| `POST /api/v1/owner/properties/{propertyId}/verification` | Submit property docs | `PROPERTY_OWNER` | `documentReference` | `PropertyVerificationResponse` | `OwnerVerificationPage` (`/owner/verification`) |
| `POST /api/v1/owner/payouts` | Request payout | `PROPERTY_OWNER` | `amount` | `OwnerPayout` | `OwnerPayoutsPage` (`/owner/payouts`) |
| `GET /api/v1/owner/payouts` | View payout history | `PROPERTY_OWNER` | `page, size` | `PagedResponse<OwnerPayout>` | `OwnerPayoutsPage` (`/owner/payouts`) |

## 8. Admin Operations (`/api/v1/admin`)

| Method & Path | Purpose | Role | Request Fields | Response Fields | Frontend Screen / Component |
|---|---|---|---|---|---|
| `GET /api/v1/admin/dashboard` | Admin overview metrics | `ADMIN` | — | `AdminDashboardResponse` | `AdminDashboardPage` (`/admin`) |
| `GET /api/v1/admin/analytics` | Admin financial & ops analytics | `ADMIN` | — | `AdminAnalyticsResponse` | `AdminDashboardPage` (`/admin`) |
| `GET /api/v1/admin/users` | List & filter users | `ADMIN` | `role?, status?, page, size` | `PagedResponse<UserProfileResponse>` | `AdminUsersPage` (`/admin/users`) |
| `POST /api/v1/admin/users/{userId}/status` | Suspend/activate user | `ADMIN` | `status` | `UserProfileResponse` | `AdminUsersPage` (`/admin/users`) |
| `GET /api/v1/admin/properties` | List properties | `ADMIN` | `verificationStatus?, page, size` | `PagedResponse<PropertyDetailResponse>` | `AdminPropertiesPage` (`/admin/properties`) |
| `POST /api/v1/admin/properties/{propertyId}/approve` | Approve property | `ADMIN` | `propertyId` | `PropertyDetailResponse` | `AdminPropertiesPage` |
| `POST /api/v1/admin/properties/{propertyId}/reject` | Reject property | `ADMIN` | `reason` | `PropertyDetailResponse` | `AdminPropertiesPage` |
| `POST /api/v1/admin/properties/{propertyId}/suspend` | Suspend property | `ADMIN` | `propertyId` | `PropertyDetailResponse` | `AdminPropertiesPage` |
| `GET /api/v1/admin/owner-verifications` | List owner KYC submissions | `ADMIN` | `status?, page, size` | `PagedResponse<OwnerVerificationResponse>` | `AdminVerificationsPage` (`/admin/verifications`) |
| `POST /api/v1/admin/owner-verifications/{verificationId}/review` | Approve/reject owner KYC | `ADMIN` | `approved, notes?` | `OwnerVerificationResponse` | `AdminVerificationsPage` |
| `GET /api/v1/admin/bookings` | List all bookings | `ADMIN` | `status?, page, size` | `PagedResponse<BookingResponse>` | `AdminBookingsPage` (`/admin/bookings`) |
| `GET /api/v1/admin/payments` | List all payments | `ADMIN` | `status?, page, size` | `PagedResponse<PaymentResponse>` | `AdminFinancePage` (`/admin/finance`) |
| `POST /api/v1/admin/commissions/{ownerId}` | Set owner commission % | `ADMIN` | `percentage` | `OwnerCommission` | `AdminFinancePage` (`/admin/finance`) |
| `POST /api/v1/admin/payouts/{payoutId}/settle` | Settle owner payout | `ADMIN` | `settlementReference` | `OwnerPayout` | `AdminFinancePage` (`/admin/finance`) |
| `POST /api/v1/admin/coupons` | Create coupon | `ADMIN` | `CreateCouponRequest` | `CouponResponse` | `AdminCouponsPage` (`/admin/coupons`) |
| `GET /api/v1/admin/coupons` | List coupons | `ADMIN` | `page, size` | `PagedResponse<CouponResponse>` | `AdminCouponsPage` (`/admin/coupons`) |
| `POST /api/v1/admin/coupons/{couponId}/status` | Toggle coupon active | `ADMIN` | `active` | `CouponResponse` | `AdminCouponsPage` (`/admin/coupons`) |
| `POST /api/v1/admin/reviews/{reviewId}/moderate` | Hide/unhide review | `ADMIN` | `hidden` | `ApiResponse<Void>` | `AdminModerationPage` (`/admin/moderation`) |
| `GET /api/v1/admin/support/tickets` | List all support tickets | `ADMIN` | `status?, page, size` | `PagedResponse<SupportTicket>` | `AdminModerationPage` (`/admin/moderation`) |
| `POST /api/v1/admin/support/tickets/{ticketId}/status` | Update ticket status | `ADMIN` | `status, resolution?` | `SupportTicket` | `AdminModerationPage` |
| `GET /api/v1/admin/disputes` | List booking disputes | `ADMIN` | `status?, page, size` | `PagedResponse<BookingDispute>` | `AdminModerationPage` |
| `POST /api/v1/admin/disputes/{disputeId}/resolve` | Resolve dispute | `ADMIN` | `status, resolution?, adminNotes?` | `BookingDispute` | `AdminModerationPage` |
| `GET /api/v1/admin/safety/complaints` | List safety complaints | `ADMIN` | `status?, page, size` | `PagedResponse<SafetyComplaint>` | `AdminModerationPage` |
| `POST /api/v1/admin/safety/complaints/{complaintId}/resolve` | Resolve & optionally suspend property | `ADMIN` | `status, resolution?, adminNotes?, suspendProperty` | `SafetyComplaint` | `AdminModerationPage` |

## 9. Documented Backend Gaps

1. **Owner Property List (`GET /api/v1/owner/properties`)**: `OwnerPropertyController` supports `POST` and `PUT /{propertyId}`, but does not expose a `GET /api/v1/owner/properties` list endpoint. The frontend documents this and lets owners manage properties by ID or directly from their booking/creation history.
2. **Notification Preferences (`GET/PUT /api/v1/notifications/preferences`)**: Schema exists in `V12`, but no REST controller endpoint is exposed yet.
3. **Admin Audit Logs (`GET /api/v1/admin/audit-logs`)**: `AuditLogService` writes audit records, but no read endpoint is exposed yet.
4. **Customer Coupon Validation (`POST /api/v1/coupons/validate`)**: Coupon creation/toggle is exposed for Admin, and `CouponService.validateAndCalculateDiscount` exists in Java, but no public/customer validation endpoint is exposed yet.
5. **Admin Payout List (`GET /api/v1/admin/payouts`)**: Admin can settle a payout by `payoutId`, but no list endpoint is exposed yet.
