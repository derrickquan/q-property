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
  // future: ownerId, createdAt, updatedAt
}
