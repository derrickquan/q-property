// lib/types.ts

// Optional helper enums
export type UnitType = "residential" | "commercial";

// ---------- Core domain models ----------

export interface Property {
  id: string;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  unitCount?: number;
  type?: UnitType;
  notes?: string;
}

export interface Tenant {
  id: string;

  /**
   * Prefer fullName. If you capture first/last separately,
   * you can also fill fullName = `${firstName} ${lastName}`.
   */
  fullName?: string;
  firstName?: string;
  lastName?: string;

  email?: string;
  phone?: string;

  // optional association to a property/unit
  propertyId?: string;
  unit?: string;

  notes?: string;
}

export type LeaseStatus = "active" | "ended" | "pending";
export type LateFeeType = "flat" | "percent";

export interface Lease {
  id: string;

  tenantId: string;
  propertyId: string;

  monthlyRent: number;       // dollars
  dueDay: number;            // 1–28
  securityDeposit: number;   // dollars

  startDate: string;         // YYYY-MM-DD
  endDate?: string;          // YYYY-MM-DD (optional)

  graceDays: number;         // >= 0
  lateFeeType: LateFeeType;  // 'flat' | 'percent'
  lateFeeValue: number;      // dollars if flat, percent if percent

  notes?: string;
  status: LeaseStatus;
}
