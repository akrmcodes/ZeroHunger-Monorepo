import type { User } from "@/lib/api";

export enum DonationStatus {
  Pending = "pending",
  Claimed = "claimed",
  PickedUp = "picked_up",
  Delivered = "delivered",
  Expired = "expired",
}

export enum FoodType {
  CookedMeal = "cooked_meal",
  Groceries = "groceries",
  Bakery = "bakery",
  Vegetables = "vegetables",
  Canned = "canned",
}

export interface Claim {
  id: number;
  donation_id: number;
  volunteer_id: number;
  status: "active" | "picked_up" | "delivered" | "cancelled";
  picked_up_at: string | null;
  delivered_at: string | null;
  notes?: string | null;
  volunteer?: User;
  created_at: string;
  updated_at?: string;
}

export interface Donation {
  id: number;
  title: string;
  description: string | null;
  food_type?: FoodType;
  quantity: number;
  expires_at: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
  status: DonationStatus;
  created_at: string;
  donor_id: number;
  donor?: User;
  claim?: Claim | null;
}

export interface DonationFormData {
  title: string;
  description?: string;
  food_type: FoodType;
  quantity: number;
  expires_at: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
}
