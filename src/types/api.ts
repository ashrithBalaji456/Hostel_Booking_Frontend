export type UserRole = 'CUSTOMER' | 'PROPERTY_OWNER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type PropertyType = 'HOSTEL' | 'PG' | 'DORMITORY' | 'CO_LIVING';
export type GenderPolicy = 'MALE_ONLY' | 'FEMALE_ONLY' | 'CO_ED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type RoomType =
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'FOUR_SHARING'
  | 'FIVE_SHARING'
  | 'SIX_SHARING'
  | 'DORMITORY'
  | 'CUSTOM';
export type RoomStatus = 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
export type BedStatus = 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
export type ImageType = 'COVER' | 'ROOM' | 'COMMON_AREA' | 'GALLERY';
export type StayType = 'SHORT_STAY' | 'LONG_STAY';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';
export type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentProvider = 'MOCK' | 'RAZORPAY';
export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  gender?: Gender;
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInMs: number;
  user: UserSummary;
  verificationToken?: string;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  gender?: Gender;
  profileImage?: string;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface PricingResponse {
  hourlyRate?: number;
  nightlyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit: number;
  extraCharges: number;
  discountPercentage: number;
}

export interface ImageResponse {
  id: string;
  imageUrl: string;
  imageType: ImageType;
  displayOrder: number;
}

export interface BedResponse {
  id: string;
  roomId: string;
  bedNumber: string;
  status: BedStatus;
}

export interface RoomResponse {
  id: string;
  propertyId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  capacity: number;
  amenities?: string;
  status: RoomStatus;
  hourlyRate?: number;
  nightlyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  beds: BedResponse[];
}

export interface PropertyDetailResponse {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description?: string;
  propertyType: PropertyType;
  address: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  genderPolicy: GenderPolicy;
  checkInTime: string;
  checkOutTime: string;
  verificationStatus: VerificationStatus;
  listingStatus: ListingStatus;
  instantBookingEnabled: boolean;
  minShortStayHours: number;
  maxShortStayDays: number;
  minLongStayDays: number;
  maxLongStayMonths: number;
  minDepositRefundMonths?: number;
  rejectionReason?: string;
  amenities: string[];
  pricing?: PricingResponse;
  images: ImageResponse[];
  rooms: RoomResponse[];
  averageRating?: number;
  reviewCount: number;
  createdAt: string;
}

export interface PropertySearchItemResponse {
  id: string;
  name: string;
  address: string;
  locality?: string;
  city: string;
  pincode: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  verificationStatus: VerificationStatus;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  startingPrice: number;
  availableBedCount: number;
  averageRating?: number;
  reviewCount: number;
  mainImage?: string;
  imageUrls?: string[];
  availableStayTypes: StayType[];
}

export interface InterviewModeResult {
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  verificationStatus: VerificationStatus;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  estimatedTravelMinutes?: number;
  availableBeds: number;
  startingPrice: number;
  checkIn: string;
  checkOut: string;
}

export interface AvailableBedInfo {
  bedId: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  hourlyRate?: number;
  nightlyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
}

export interface PropertyAvailabilityResponse {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  totalBeds: number;
  availableBedsCount: number;
  availableBeds: AvailableBedInfo[];
}

export interface BookingResponse {
  id: string;
  bookingReference: string;
  userId: string;
  propertyId: string;
  propertyName: string;
  bedId: string;
  bedNumber: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  stayType: StayType;
  bookingStatus: BookingStatus;
  approvalRequired: boolean;
  guestName: string;
  guestPhone: string;
  baseAmount: number;
  depositAmount: number;
  discountAmount: number;
  extraCharges: number;
  totalAmount: number;
  amountPaid: number;
  refundAmount: number;
  cancellationReason?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface BookingStatusResponse {
  bookingId: string;
  bookingReference: string;
  bookingStatus: BookingStatus;
  approvalRequired: boolean;
  totalAmount: number;
  amountPaid: number;
  expiresAt?: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  fromStatus?: BookingStatus;
  toStatus: BookingStatus;
  changedBy?: string;
  reason?: string;
  createdAt: string;
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  bookingReference: string;
  paymentReference: string;
  provider: PaymentProvider;
  providerOrderId?: string;
  providerTransactionId?: string;
  amount: number;
  refundAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  failureReason?: string;
  createdAt: string;
}

export interface ReviewResponse {
  id: string;
  bookingId: string;
  propertyId: string;
  userId: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface FavoriteResponse {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: PropertyType;
  city: string;
  locality?: string;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  readStatus: boolean;
  createdAt: string;
}

export interface AvailabilityBlockResponse {
  id: string;
  bedId: string;
  blockType: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt: string;
}

export interface RentSchedule {
  id: string;
  bookingId: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  createdAt: string;
}

export interface SecurityDeposit {
  id: string;
  bookingId: string;
  depositAmount: number;
  deductedAmount: number;
  refundedAmount: number;
  deductionReason?: string;
  disputed: boolean;
  status: string;
}

export interface OwnerVerificationResponse {
  id: string;
  ownerId: string;
  ownerName: string;
  contactDetails: string;
  documentType: string;
  documentReference: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface OwnerPayout {
  id: string;
  ownerId: string;
  grossAmount: number;
  commissionAmount: number;
  refundAdjustments: number;
  netPayable: number;
  status: string;
  settlementReference?: string;
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface SupportTicket {
  id: string;
  ticketReference: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userRole?: string;
  bookingId?: string;
  bookingReference?: string;
  propertyName?: string;
  assignedAdminId?: string;
  category: string;
  subject: string;
  initialMessage?: string;
  status: string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

export interface BookingDispute {
  id: string;
  disputeReference: string;
  bookingId: string;
  customerId: string;
  propertyId: string;
  category: string;
  description: string;
  evidenceReferences?: string;
  status: string;
  resolution?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface SafetyComplaint {
  id: string;
  complaintReference: string;
  reporterId: string;
  propertyId: string;
  bookingId?: string;
  category: string;
  description: string;
  evidenceReferences?: string;
  status: string;
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
}

export interface CouponResponse {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minBookingAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  perCustomerLimit: number;
  propertyId?: string;
  stayType?: StayType;
  active: boolean;
}

export interface CouponPreviewResponse {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  minBookingAmount: number;
  maxDiscountAmount?: number;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolvedOrClosed: number;
}

export interface EligibleTicketProperty {
  propertyId: string;
  propertyName: string;
  city: string;
  roomNumber: string;
  bedNumber: string;
}

export interface ChatConversation {
  id: string;
  propertyId: string;
  propertyName: string;
  customerId: string;
  customerName: string;
  ownerId: string;
  ownerName: string;
  roomNumber?: string;
  bedNumber?: string;
  lastMessage?: string;
  unreadCount: number;
  lastMessageAt: string;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  message: string;
  readByRecipient: boolean;
  createdAt: string;
}

export interface HostelTicket {
  id: string;
  ticketReference: string;
  propertyId: string;
  propertyName: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  roomNumber?: string;
  bedNumber?: string;
  category: string;
  subject: string;
  description: string;
  anonymous: boolean;
  status: string;
  ownerResolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerDashboardResponse {
  totalProperties: number;
  pendingBookings: number;
  confirmedBookings: number;
  netEarnings: number;
  upcomingCheckIns: BookingResponse[];
}

export interface AdminDashboardResponse {
  totalUsers: number;
  totalCustomers: number;
  totalOwners: number;
  totalProperties: number;
  pendingPropertyVerifications: number;
  totalBookings: number;
  confirmedBookings: number;
  netPlatformRevenue: number;
}

export interface OwnerAnalyticsResponse {
  totalProperties: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  netRevenue: number;
}

export interface AdminAnalyticsResponse {
  totalCustomers: number;
  totalOwners: number;
  totalProperties: number;
  approvedProperties: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  netBookingRevenue: number;
  openDisputes: number;
  openSafetyComplaints: number;
}
