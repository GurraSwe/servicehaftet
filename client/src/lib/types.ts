// Type definitions matching the database schema

export interface Car {
  id: number;
  user_id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  license_plate: string | null;
  current_mileage: number;
  service_interval_months: number | null;
  service_interval_kilometers: number | null;
  notes: string | null;
  created_at: string;
}

export interface CarInput {
  name: string;
  make: string;
  model: string;
  year: number;
  vin?: string | null;
  license_plate?: string | null;
  current_mileage: number;
  service_interval_months?: number | null;
  service_interval_kilometers?: number | null;
  notes?: string | null;
}

export interface ServiceLog {
  id: number;
  car_id: number;
  user_id: string;
  date: string;
  mileage: number;
  total_cost: number;
  notes: string | null;
  created_at: string;
}

export interface ServiceLogInput {
  car_id: number;
  date: string;
  mileage: number;
  total_cost?: number;
  notes?: string | null;
}

export interface ServiceItem {
  id: number;
  service_log_id: number;
  user_id: string;
  type: string;
  description: string | null;
  cost: number;
  created_at: string;
}

export interface ServiceItemInput {
  service_log_id: number;
  type: string;
  description?: string | null;
  cost?: number;
}

export interface Reminder {
  id: number;
  car_id: number;
  user_id: string;
  type: string;
  due_date: string | null;
  due_mileage: number | null;
  recurring: boolean;
  interval_months: number | null;
  interval_kilometers: number | null;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface ReminderInput {
  car_id: number;
  type: string;
  due_date?: string | null;
  due_mileage?: number | null;
  recurring?: boolean;
  interval_months?: number | null;
  interval_kilometers?: number | null;
  is_completed?: boolean;
  notes?: string | null;
}

