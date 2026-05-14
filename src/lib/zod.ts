import { z } from "zod";

// Auth schemas
export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Property schemas
export const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().default("US"),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "MULTIFAMILY", "TOWNHOUSE", "CONDO", "SINGLE_FAMILY"]),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number().int().optional(),
  yearBuilt: z.number().int().optional(),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  taxId: z.string().optional(),
  insurancePolicy: z.string().optional(),
  insuranceExpiry: z.string().datetime().optional(),
});

// Unit schemas
export const unitSchema = z.object({
  propertyId: z.string().cuid(),
  unitNumber: z.string().min(1, "Unit number is required"),
  floor: z.string().optional(),
  rentAmount: z.number().positive("Rent must be positive"),
  depositAmount: z.number().min(0).default(0),
  squareFeet: z.number().int().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
});

// Tenant schemas
export const tenantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  creditScore: z.number().int().min(300).max(850).optional(),
  notes: z.string().optional(),
});

// Lease schemas
export const leaseSchema = z.object({
  tenantId: z.string().cuid(),
  unitId: z.string().cuid(),
  propertyId: z.string().cuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  rentAmount: z.number().positive(),
  depositAmount: z.number().min(0).default(0),
  lateFeeAmount: z.number().min(0).default(50),
  lateFeeAfterDays: z.number().int().min(0).default(5),
  gracePeriodDays: z.number().int().min(0).default(3),
  autoRenew: z.boolean().default(false),
  renewalTerms: z.string().optional(),
});

// Payment schemas
export const paymentSchema = z.object({
  tenantId: z.string().cuid(),
  leaseId: z.string().cuid().optional(),
  rentChargeId: z.string().cuid().optional(),
  amount: z.number().positive(),
  type: z.enum(["RENT", "DEPOSIT", "LATE_FEE", "UTILITY", "MAINTENANCE", "OTHER"]).default("RENT"),
  method: z.enum(["CARD", "BANK_TRANSFER", "CASH", "CHECK", "MONEY_ORDER", "ACH"]).default("CARD"),
  description: z.string().optional(),
});

// Maintenance schemas
export const maintenanceRequestSchema = z.object({
  unitId: z.string().cuid(),
  propertyId: z.string().cuid(),
  tenantId: z.string().cuid().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "STRUCTURAL",
    "PEST_CONTROL", "LANDSCAPING", "SECURITY", "GENERAL", "EMERGENCY"
  ]).default("GENERAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  photos: z.array(z.string()).default([]),
});

// Expense schemas
export const expenseSchema = z.object({
  propertyId: z.string().cuid().optional(),
  unitId: z.string().cuid().optional(),
  category: z.enum([
    "MAINTENANCE", "REPAIRS", "UTILITIES", "INSURANCE", "TAXES",
    "MORTGAGE", "MANAGEMENT", "ADVERTISING", "LEGAL", "SUPPLIES",
    "CLEANING", "LANDSCAPING", "HOA", "OTHER"
  ]).default("OTHER"),
  amount: z.number().positive(),
  description: z.string().min(1, "Description is required"),
  date: z.string().datetime(),
  vendor: z.string().optional(),
  taxDeductible: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
});

// Document schemas
export const documentSchema = z.object({
  propertyId: z.string().cuid().optional(),
  tenantId: z.string().cuid().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum([
    "LEASE", "APPLICATION", "ID_DOCUMENT", "INSURANCE", "INSPECTION",
    "RECEIPT", "CONTRACT", "EVICTION_NOTICE", "COMPLIANCE", "PHOTO", "OTHER"
  ]).default("OTHER"),
  url: z.string().url(),
  tags: z.array(z.string()).default([]),
});

// Message schemas
export const messageSchema = z.object({
  recipientId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  tenantId: z.string().cuid().optional(),
  subject: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
  sentVia: z.enum(["IN_APP", "EMAIL", "SMS"]).default("IN_APP"),
});

// Settings schemas
export const landlordSettingsSchema = z.object({
  defaultLateFee: z.number().min(0).default(50),
  defaultGracePeriod: z.number().int().min(0).default(3),
  autoChargeEnabled: z.boolean().default(false),
  reminderDays: z.array(z.number().int()).default([3, 1]),
  currency: z.string().default("USD"),
  timezone: z.string().default("America/New_York"),
  dateFormat: z.string().default("MM/DD/YYYY"),
  emailSignature: z.string().optional(),
  brandingColor: z.string().optional(),
});
