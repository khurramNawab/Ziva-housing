// ============================================================
// Ziva HOUSING — Shared Types & Enums
// Used by both API (NestJS) and Web (Next.js)
// ============================================================

// ─── User ─────────────────────────────────────────────────
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  OWNER = 'OWNER',
  AGENT = 'AGENT',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

// ─── Property ─────────────────────────────────────────────
export enum PropertyPurpose {
  SELL = 'SELL',
  RENT = 'RENT',
  LEASE = 'LEASE',
  PG = 'PG',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  INDEPENDENT_HOUSE = 'INDEPENDENT_HOUSE',
  VILLA = 'VILLA',
  PLOT = 'PLOT',
  COMMERCIAL_OFFICE = 'COMMERCIAL_OFFICE',
  COMMERCIAL_SHOP = 'COMMERCIAL_SHOP',
  COMMERCIAL_WAREHOUSE = 'COMMERCIAL_WAREHOUSE',
  FARM_HOUSE = 'FARM_HOUSE',
  STUDIO = 'STUDIO',
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum FurnishingStatus {
  UNFURNISHED = 'UNFURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  FULLY_FURNISHED = 'FULLY_FURNISHED',
}

// ─── Lead ─────────────────────────────────────────────────
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  VISIT_SCHEDULED = 'VISIT_SCHEDULED',
  NEGOTIATION = 'NEGOTIATION',
  BOOKING = 'BOOKING',
  COMPLETED = 'COMPLETED',
  LOST = 'LOST',
}

// ─── Visit ─────────────────────────────────────────────────
export enum VisitStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ─── Transaction ─────────────────────────────────────────────
export enum TransactionStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

// ─── Notifications ─────────────────────────────────────────────
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP',
}

export enum NotificationType {
  ENQUIRY_CREATED = 'ENQUIRY_CREATED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_FLAGGED = 'MESSAGE_FLAGGED',
  VISIT_REQUESTED = 'VISIT_REQUESTED',
  VISIT_ACCEPTED = 'VISIT_ACCEPTED',
  VISIT_REJECTED = 'VISIT_REJECTED',
  VISIT_COMPLETED = 'VISIT_COMPLETED',
  OFFER_RECEIVED = 'OFFER_RECEIVED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PROPERTY_APPROVED = 'PROPERTY_APPROVED',
  PROPERTY_REJECTED = 'PROPERTY_REJECTED',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  JOB_ASSIGNED = 'JOB_ASSIGNED',
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
}

// ─── Flagged Content ─────────────────────────────────────────────
export enum FlaggedContentType {
  PHONE_NUMBER = 'PHONE_NUMBER',
  EMAIL_ADDRESS = 'EMAIL_ADDRESS',
  WHATSAPP_LINK = 'WHATSAPP_LINK',
  SOCIAL_HANDLE = 'SOCIAL_HANDLE',
  EXTERNAL_URL = 'EXTERNAL_URL',
  ALTERNATE_PHONE = 'ALTERNATE_PHONE',
}

export interface FlaggedPattern {
  type: FlaggedContentType;
  original: string;
  masked: string;
  startIndex: number;
  endIndex: number;
}

// ─── API Response Types ────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Property Search ────────────────────────────────────────
export interface PropertySearchFilters {
  city?: string;
  locality?: string;
  purpose?: PropertyPurpose;
  propertyType?: PropertyType;
  bhk?: number[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  furnishing?: FurnishingStatus;
  amenities?: string[];
  isZivaVerified?: boolean;
  status?: PropertyStatus;
  q?: string; // free text search
}

// ─── Safe User (never includes sensitive data) ─────────────
export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  profilePictureUrl?: string;
  isPhoneVerified: boolean;
  createdAt: string;
}

// ─── Safe Property (never includes owner contact info) ──────
export interface SafeProperty {
  id: string;
  title: string;
  description: string;
  purpose: PropertyPurpose;
  propertyType: PropertyType;
  status: PropertyStatus;
  isZivaVerified: boolean;
  locality: string;
  city: string;
  state: string;
  bhk?: number;
  bathrooms?: number;
  builtUpArea?: number;
  carpetArea?: number;
  furnishing: FurnishingStatus;
  expectedPrice?: number;
  monthlyRent?: number;
  photos: Array<{ url: string; thumbnailUrl?: string; isPrimary: boolean }>;
  amenities: string[];
  viewCount: number;
  enquiryCount: number;
  // Owner details — only name and ID, NEVER phone/email
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

// ─── Lead Types ────────────────────────────────────────────
export interface SafeLead {
  id: string;
  status: LeadStatus;
  property: {
    id: string;
    title: string;
    city: string;
    locality: string;
    purpose: PropertyPurpose;
    photos: Array<{ url: string; isPrimary: boolean }>;
  };
  // For customer view: show owner's first name only
  // For owner view: show customer details
  counterparty: {
    id: string;
    firstName: string;
    lastInitial: string; // e.g. "S." — never full last name until both agree
  };
  messageCount: number;
  lastMessage?: {
    contentSanitized: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Lead ID Generator spec ────────────────────────────────
// Format: JVH-{CITY_CODE_3CHARS}-{YEAR}-{SEQ_5DIGITS}
// Example: JVH-MUM-2024-00001
export function formatLeadId(cityCode: string, year: number, seq: number): string {
  const city = cityCode.toUpperCase().substring(0, 3).padEnd(3, 'X');
  const sequence = String(seq).padStart(5, '0');
  return `JVH-${city}-${year}-${sequence}`;
}

// ─── Transaction ID Generator spec ────────────────────────────────
// Format: JVH-PAY-{YYYYMMDD}-{SEQ_5DIGITS}
// Example: JVH-PAY-20241225-00001
export function formatTransactionId(date: Date, seq: number): string {
  const d = date.toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(seq).padStart(5, '0');
  return `JVH-PAY-${d}-${sequence}`;
}

// ─── Contact Scanner Regex Patterns ────────────────────────
// These are replicated here for reference; actual scanner is in API
export const CONTACT_SCAN_PATTERNS = {
  INDIAN_PHONE: /(?:(?:\+?91|0)?[\s\-]?)(?:[6-9]\d{9})/g,
  INTL_PHONE: /\+?(?:[0-9]{1,3})?[-.\s]?\(?(?:\d{1,3})\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  EMAIL: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  WHATSAPP: /(?:wa\.me|api\.whatsapp\.com|whatsapp\.com)\/(?:send)?\/?[0-9]*/gi,
  INSTAGRAM: /@[a-zA-Z0-9_.]{1,30}|instagram\.com\/[a-zA-Z0-9_.]{1,30}/gi,
  FACEBOOK: /facebook\.com\/[a-zA-Z0-9.]{1,50}|fb\.me\/[a-zA-Z0-9.]{1,50}/gi,
  EXTERNAL_URL: /https?:\/\/(?!(?:Zivahousing\.com))[^\s<>"{}|\\^`[\]]+/gi,
  ENCODED_PHONE: /(?:zero|one|two|three|four|five|six|seven|eight|nine|\boh\b)/gi,
};
