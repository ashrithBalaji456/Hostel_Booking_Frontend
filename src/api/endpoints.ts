import { apiRequest, buildQuery } from './client';
import type {
  AdminAnalyticsResponse,
  AdminDashboardResponse,
  AuthResponse,
  AvailabilityBlockResponse,
  BedResponse,
  BookingDispute,
  BookingResponse,
  BookingStatusHistory,
  BookingStatusResponse,
  CouponResponse,
  FavoriteResponse,
  InterviewModeResult,
  NotificationResponse,
  OwnerAnalyticsResponse,
  OwnerDashboardResponse,
  OwnerPayout,
  OwnerVerificationResponse,
  PagedResponse,
  PaymentMethod,
  PaymentResponse,
  PropertyAvailabilityResponse,
  PropertyDetailResponse,
  PropertySearchItemResponse,
  RentSchedule,
  ReviewResponse,
  RoomResponse,
  SafetyComplaint,
  SecurityDeposit,
  SupportMessage,
  SupportTicket,
  UserProfileResponse,
} from '../types/api';

export const authApi = {
  register: (body: Record<string, unknown>) =>
    apiRequest<AuthResponse>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  login: (body: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string; token?: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),
  resetPassword: (body: { token: string; newPassword: string }) =>
    apiRequest<void>('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  verifyEmail: (token: string) =>
    apiRequest<void>('/api/v1/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }), skipAuth: true }),
};

export const userApi = {
  getProfile: () => apiRequest<UserProfileResponse>('/api/v1/users/me'),
  updateProfile: (body: Record<string, unknown>) =>
    apiRequest<UserProfileResponse>('/api/v1/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  getMyBookings: (page = 0, size = 20) =>
    apiRequest<PagedResponse<BookingResponse>>(`/api/v1/users/me/bookings${buildQuery({ page, size })}`),
  getFavorites: (page = 0, size = 20) =>
    apiRequest<PagedResponse<FavoriteResponse>>(`/api/v1/users/me/favorites${buildQuery({ page, size })}`),
  addFavorite: (propertyId: string) =>
    apiRequest<FavoriteResponse>(`/api/v1/users/me/favorites/${propertyId}`, { method: 'POST' }),
  removeFavorite: (propertyId: string) =>
    apiRequest<void>(`/api/v1/users/me/favorites/${propertyId}`, { method: 'DELETE' }),
};

export const propertyApi = {
  search: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<PropertySearchItemResponse>>(`/api/v1/properties${buildQuery(params)}`, { skipAuth: true }),
  searchEmergency: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<PropertySearchItemResponse>>(`/api/v1/properties/emergency${buildQuery(params)}`, { skipAuth: true }),
  searchInterviewMode: (params: Record<string, unknown>) =>
    apiRequest<InterviewModeResult[]>(`/api/v1/properties/interview-mode${buildQuery(params)}`, { skipAuth: true }),
  getDetails: (propertyId: string) =>
    apiRequest<PropertyDetailResponse>(`/api/v1/properties/${propertyId}`, { skipAuth: true }),
  getAvailability: (propertyId: string, checkIn: string, checkOut: string) =>
    apiRequest<PropertyAvailabilityResponse>(
      `/api/v1/properties/${propertyId}/availability${buildQuery({ checkIn, checkOut })}`,
      { skipAuth: true },
    ),
  getRooms: (propertyId: string) =>
    apiRequest<RoomResponse[]>(`/api/v1/properties/${propertyId}/rooms`, { skipAuth: true }),
  getReviews: (propertyId: string, page = 0, size = 10) =>
    apiRequest<PagedResponse<ReviewResponse>>(`/api/v1/properties/${propertyId}/reviews${buildQuery({ page, size })}`, { skipAuth: true }),
};

export const bookingApi = {
  create: (body: Record<string, unknown>) =>
    apiRequest<BookingResponse>('/api/v1/bookings', { method: 'POST', body: JSON.stringify(body) }),
  list: (page = 0, size = 20) =>
    apiRequest<PagedResponse<BookingResponse>>(`/api/v1/bookings${buildQuery({ page, size })}`),
  getById: (bookingId: string) => apiRequest<BookingResponse>(`/api/v1/bookings/${bookingId}`),
  getStatus: (bookingId: string) => apiRequest<BookingStatusResponse>(`/api/v1/bookings/${bookingId}/status`),
  confirm: (bookingId: string) => apiRequest<BookingResponse>(`/api/v1/bookings/${bookingId}/confirm`, { method: 'POST' }),
  cancel: (bookingId: string, reason?: string) =>
    apiRequest<BookingResponse>(`/api/v1/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  modify: (bookingId: string, body: { newCheckIn: string; newCheckOut: string; newBedId?: string }) =>
    apiRequest<BookingResponse>(`/api/v1/bookings/${bookingId}`, { method: 'PUT', body: JSON.stringify(body) }),
  extend: (bookingId: string, newCheckOut: string) =>
    apiRequest<BookingResponse>(`/api/v1/bookings/${bookingId}/extend`, {
      method: 'POST',
      body: JSON.stringify({ newCheckOut }),
    }),
  transitionLongStay: (bookingId: string, newCheckOut: string) =>
    apiRequest<BookingResponse>(`/api/v1/bookings/${bookingId}/transition-long-stay`, {
      method: 'POST',
      body: JSON.stringify({ newCheckOut }),
    }),
  getHistory: (bookingId: string) => apiRequest<BookingStatusHistory[]>(`/api/v1/bookings/${bookingId}/history`),
  confirmCheckIn: (bookingId: string) =>
    apiRequest<unknown>(`/api/v1/bookings/${bookingId}/checkin/confirm`, { method: 'POST' }),
  reportFailure: (bookingId: string, body: { failureReason: string; description?: string }) =>
    apiRequest<{ failure: { id: string; resolutionStatus: string }; alternatives: PropertySearchItemResponse[] }>(
      `/api/v1/bookings/${bookingId}/failure`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  respondFailure: (failureId: string, body: { accepted: boolean; alternativePropertyId?: string; alternativeBedId?: string }) =>
    apiRequest<unknown>(`/api/v1/bookings/failures/${failureId}/respond`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const paymentApi = {
  initiate: (bookingId: string, paymentMethod: PaymentMethod, idempotencyKey: string) =>
    apiRequest<PaymentResponse>('/api/v1/payments/initiate', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ bookingId, paymentMethod, idempotencyKey }),
    }),
  getById: (paymentId: string) => apiRequest<PaymentResponse>(`/api/v1/payments/${paymentId}`),
  verify: (paymentId: string, body: { providerTransactionId: string; signature?: string; simulateFailure: boolean; failureReason?: string }) =>
    apiRequest<PaymentResponse>(`/api/v1/payments/${paymentId}/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  refund: (paymentId: string, body?: { amount?: number; reason?: string }) =>
    apiRequest<PaymentResponse>(`/api/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
};

export const customerOpsApi = {
  generateRentSchedule: (bookingId: string) =>
    apiRequest<RentSchedule[]>(`/api/v1/rent/bookings/${bookingId}/schedule`, { method: 'POST' }),
  getRentSchedule: (bookingId: string) => apiRequest<RentSchedule[]>(`/api/v1/rent/bookings/${bookingId}/schedule`),
  payRent: (scheduleId: string, amount: number) =>
    apiRequest<unknown>(`/api/v1/rent/schedules/${scheduleId}/pay${buildQuery({ amount })}`, { method: 'POST' }),
  getDeposit: (bookingId: string) => apiRequest<SecurityDeposit>(`/api/v1/deposits/bookings/${bookingId}`),
  requestDepositRefund: (bookingId: string) =>
    apiRequest<SecurityDeposit>(`/api/v1/deposits/bookings/${bookingId}/request-refund`, { method: 'POST' }),
  disputeDeposit: (bookingId: string) =>
    apiRequest<SecurityDeposit>(`/api/v1/deposits/bookings/${bookingId}/dispute`, { method: 'POST' }),
  createReview: (body: { bookingId: string; rating: number; comment?: string }) =>
    apiRequest<ReviewResponse>('/api/v1/reviews', { method: 'POST', body: JSON.stringify(body) }),
  updateReview: (reviewId: string, body: { rating: number; comment?: string }) =>
    apiRequest<ReviewResponse>(`/api/v1/reviews/${reviewId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteReview: (reviewId: string) => apiRequest<void>(`/api/v1/reviews/${reviewId}`, { method: 'DELETE' }),
  getNotifications: (page = 0, size = 20) =>
    apiRequest<PagedResponse<NotificationResponse>>(`/api/v1/notifications${buildQuery({ page, size })}`),
  markNotificationRead: (notificationId: string) =>
    apiRequest<void>(`/api/v1/notifications/${notificationId}/read`, { method: 'POST' }),
  createTicket: (body: { bookingId?: string; category: string; subject: string; message: string }) =>
    apiRequest<SupportTicket>('/api/v1/support/tickets', { method: 'POST', body: JSON.stringify(body) }),
  getTickets: (page = 0, size = 20) =>
    apiRequest<PagedResponse<SupportTicket>>(`/api/v1/support/tickets${buildQuery({ page, size })}`),
  getTicketMessages: (ticketId: string) => apiRequest<SupportMessage[]>(`/api/v1/support/tickets/${ticketId}/messages`),
  replyTicket: (ticketId: string, message: string) =>
    apiRequest<SupportMessage>(`/api/v1/support/tickets/${ticketId}/messages${buildQuery({ message })}`, { method: 'POST' }),
  createDispute: (body: { bookingId: string; category: string; description: string; evidenceReferences?: string }) =>
    apiRequest<BookingDispute>('/api/v1/disputes', { method: 'POST', body: JSON.stringify(body) }),
  getDisputes: (page = 0, size = 20) =>
    apiRequest<PagedResponse<BookingDispute>>(`/api/v1/disputes${buildQuery({ page, size })}`),
  submitSafetyComplaint: (body: { propertyId: string; bookingId?: string; category: string; description: string; evidenceReferences?: string }) =>
    apiRequest<SafetyComplaint>('/api/v1/safety/complaints', { method: 'POST', body: JSON.stringify(body) }),
};

export const ownerApi = {
  getDashboard: () => apiRequest<OwnerDashboardResponse>('/api/v1/owner/dashboard'),
  getAnalytics: () => apiRequest<OwnerAnalyticsResponse>('/api/v1/owner/analytics'),
  createProperty: (body: Record<string, unknown>) =>
    apiRequest<PropertyDetailResponse>('/api/v1/owner/properties', { method: 'POST', body: JSON.stringify(body) }),
  updateProperty: (propertyId: string, body: Record<string, unknown>) =>
    apiRequest<PropertyDetailResponse>(`/api/v1/owner/properties/${propertyId}`, { method: 'PUT', body: JSON.stringify(body) }),
  addRoom: (propertyId: string, body: Record<string, unknown>) =>
    apiRequest<RoomResponse>(`/api/v1/owner/properties/${propertyId}/rooms`, { method: 'POST', body: JSON.stringify(body) }),
  addBed: (propertyId: string, body: { roomId: string; bedNumber: string }) =>
    apiRequest<BedResponse>(`/api/v1/owner/properties/${propertyId}/beds`, { method: 'POST', body: JSON.stringify(body) }),
  updateBedAvailability: (propertyId: string, body: { bedId: string; status: string }) =>
    apiRequest<BedResponse>(`/api/v1/owner/properties/${propertyId}/availability`, { method: 'PUT', body: JSON.stringify(body) }),
  createBlock: (body: { bedId: string; blockType: string; startTime: string; endTime: string; reason?: string }) =>
    apiRequest<AvailabilityBlockResponse>('/api/v1/owner/availability-blocks', { method: 'POST', body: JSON.stringify(body) }),
  getBlocksForBed: (bedId: string) =>
    apiRequest<AvailabilityBlockResponse[]>(`/api/v1/owner/availability-blocks/bed/${bedId}`),
  deleteBlock: (blockId: string) =>
    apiRequest<void>(`/api/v1/owner/availability-blocks/${blockId}`, { method: 'DELETE' }),
  getBookings: (params: { status?: string; page?: number; size?: number }) =>
    apiRequest<PagedResponse<BookingResponse>>(`/api/v1/owner/bookings${buildQuery(params)}`),
  approveBooking: (bookingId: string) =>
    apiRequest<BookingResponse>(`/api/v1/owner/bookings/${bookingId}/approve`, { method: 'POST' }),
  rejectBooking: (bookingId: string, reason: string) =>
    apiRequest<BookingResponse>(`/api/v1/owner/bookings/${bookingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  createWalkIn: (body: Record<string, unknown>) =>
    apiRequest<BookingResponse>('/api/v1/owner/bookings/walk-in', { method: 'POST', body: JSON.stringify(body) }),
  checkIn: (bookingId: string, notes?: string) =>
    apiRequest<unknown>(`/api/v1/owner/bookings/${bookingId}/checkin${buildQuery({ notes })}`, { method: 'POST' }),
  checkOut: (bookingId: string, lateFee?: number, notes?: string) =>
    apiRequest<unknown>(`/api/v1/owner/bookings/${bookingId}/checkout${buildQuery({ lateFee, notes })}`, { method: 'POST' }),
  markNoShow: (bookingId: string, notes?: string) =>
    apiRequest<void>(`/api/v1/owner/bookings/${bookingId}/no-show${buildQuery({ notes })}`, { method: 'POST' }),
  settleDeposit: (bookingId: string, deduction?: number, reason?: string) =>
    apiRequest<SecurityDeposit>(`/api/v1/owner/deposits/bookings/${bookingId}/settle${buildQuery({ deduction, reason })}`, { method: 'POST' }),
  submitVerification: (body: { ownerName: string; contactDetails: string; documentType: string; documentReference: string }) =>
    apiRequest<OwnerVerificationResponse>('/api/v1/owner/verifications', { method: 'POST', body: JSON.stringify(body) }),
  getVerifications: () => apiRequest<OwnerVerificationResponse[]>('/api/v1/owner/verifications'),
  submitPropertyVerification: (propertyId: string, documentReference: string) =>
    apiRequest<unknown>(`/api/v1/owner/properties/${propertyId}/verification`, {
      method: 'POST',
      body: JSON.stringify({ documentReference }),
    }),
  requestPayout: (amount: number) =>
    apiRequest<OwnerPayout>(`/api/v1/owner/payouts${buildQuery({ amount })}`, { method: 'POST' }),
  getPayouts: (page = 0, size = 20) =>
    apiRequest<PagedResponse<OwnerPayout>>(`/api/v1/owner/payouts${buildQuery({ page, size })}`),
};

export const adminApi = {
  getDashboard: () => apiRequest<AdminDashboardResponse>('/api/v1/admin/dashboard'),
  getAnalytics: () => apiRequest<AdminAnalyticsResponse>('/api/v1/admin/analytics'),
  listUsers: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<UserProfileResponse>>(`/api/v1/admin/users${buildQuery(params)}`),
  updateUserStatus: (userId: string, status: string) =>
    apiRequest<UserProfileResponse>(`/api/v1/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  listProperties: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<PropertyDetailResponse>>(`/api/v1/admin/properties${buildQuery(params)}`),
  approveProperty: (propertyId: string) =>
    apiRequest<PropertyDetailResponse>(`/api/v1/admin/properties/${propertyId}/approve`, { method: 'POST' }),
  rejectProperty: (propertyId: string, reason: string) =>
    apiRequest<PropertyDetailResponse>(`/api/v1/admin/properties/${propertyId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  suspendProperty: (propertyId: string) =>
    apiRequest<PropertyDetailResponse>(`/api/v1/admin/properties/${propertyId}/suspend`, { method: 'POST' }),
  listOwnerVerifications: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<OwnerVerificationResponse>>(`/api/v1/admin/owner-verifications${buildQuery(params)}`),
  reviewOwnerVerification: (verificationId: string, approved: boolean, notes?: string) =>
    apiRequest<OwnerVerificationResponse>(`/api/v1/admin/owner-verifications/${verificationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved, notes }),
    }),
  listBookings: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<BookingResponse>>(`/api/v1/admin/bookings${buildQuery(params)}`),
  listPayments: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<PaymentResponse>>(`/api/v1/admin/payments${buildQuery(params)}`),
  setCommission: (ownerId: string, percentage: number) =>
    apiRequest<unknown>(`/api/v1/admin/commissions/${ownerId}${buildQuery({ percentage })}`, { method: 'POST' }),
  settlePayout: (payoutId: string, settlementReference: string) =>
    apiRequest<OwnerPayout>(`/api/v1/admin/payouts/${payoutId}/settle${buildQuery({ settlementReference })}`, { method: 'POST' }),
  listCoupons: (page = 0, size = 20) =>
    apiRequest<PagedResponse<CouponResponse>>(`/api/v1/admin/coupons${buildQuery({ page, size })}`),
  createCoupon: (body: Record<string, unknown>) =>
    apiRequest<CouponResponse>('/api/v1/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
  toggleCoupon: (couponId: string, active: boolean) =>
    apiRequest<CouponResponse>(`/api/v1/admin/coupons/${couponId}/status${buildQuery({ active })}`, { method: 'POST' }),
  moderateReview: (reviewId: string, hidden: boolean) =>
    apiRequest<void>(`/api/v1/admin/reviews/${reviewId}/moderate`, { method: 'POST', body: JSON.stringify({ hidden }) }),
  listSupportTickets: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<SupportTicket>>(`/api/v1/admin/support/tickets${buildQuery(params)}`),
  updateSupportTicket: (ticketId: string, status: string, resolution?: string) =>
    apiRequest<SupportTicket>(`/api/v1/admin/support/tickets/${ticketId}/status${buildQuery({ status, resolution })}`, { method: 'POST' }),
  listDisputes: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<BookingDispute>>(`/api/v1/admin/disputes${buildQuery(params)}`),
  resolveDispute: (disputeId: string, status: string, resolution?: string, adminNotes?: string) =>
    apiRequest<BookingDispute>(`/api/v1/admin/disputes/${disputeId}/resolve${buildQuery({ status, resolution, adminNotes })}`, { method: 'POST' }),
  listSafetyComplaints: (params: Record<string, unknown>) =>
    apiRequest<PagedResponse<SafetyComplaint>>(`/api/v1/admin/safety/complaints${buildQuery(params)}`),
  resolveSafetyComplaint: (complaintId: string, status: string, resolution?: string, adminNotes?: string, suspendProperty = false) =>
    apiRequest<SafetyComplaint>(
      `/api/v1/admin/safety/complaints/${complaintId}/resolve${buildQuery({ status, resolution, adminNotes, suspendProperty })}`,
      { method: 'POST' },
    ),
};
