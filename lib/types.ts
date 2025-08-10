// lib/types.ts

export type UnitType = "residential" | "commercial";

export interface Property {
  id: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  unitCount: number;
  type: UnitType;
  notes?: string;
}

export interface Tenant {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  /** Foreign key to Property.id */
  propertyId: string;
  /** Optional unit identifier/number within the property */
  unit?: string;
  notes?: string;
  createdAt: string; // ISO string
}
