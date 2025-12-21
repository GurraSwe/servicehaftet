import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Vehicle, InsertVehicle, Service, InsertService, Reminder, InsertReminder } from "@shared/schema";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

function createAuthenticatedClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export interface ISupabaseStorage {
  getVehicles(accessToken: string, userId: string): Promise<Vehicle[]>;
  getVehicle(accessToken: string, id: number): Promise<Vehicle | undefined>;
  createVehicle(accessToken: string, vehicle: InsertVehicle & { userId: string }): Promise<Vehicle>;
  updateVehicle(accessToken: string, id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle>;
  deleteVehicle(accessToken: string, id: number): Promise<void>;

  getServices(accessToken: string, vehicleId: number): Promise<Service[]>;
  createService(accessToken: string, service: InsertService): Promise<Service>;
  deleteService(accessToken: string, id: number): Promise<void>;

  getReminders(accessToken: string, vehicleId: number): Promise<Reminder[]>;
  createReminder(accessToken: string, reminder: InsertReminder): Promise<Reminder>;
  updateReminder(accessToken: string, id: number, reminder: Partial<InsertReminder>): Promise<Reminder>;
  deleteReminder(accessToken: string, id: number): Promise<void>;
}

export class SupabaseStorage implements ISupabaseStorage {
  async getVehicles(accessToken: string, userId: string): Promise<Vehicle[]> {
    const client = createAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return this.mapVehicles(data || []);
  }

  async getVehicle(accessToken: string, id: number): Promise<Vehicle | undefined> {
    const client = createAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return undefined;
      throw new Error(error.message);
    }
    return this.mapVehicle(data);
  }

  async createVehicle(accessToken: string, vehicle: InsertVehicle & { userId: string }): Promise<Vehicle> {
    const client = createAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from("vehicles")
      .insert({
        user_id: vehicle.userId,
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin || null,
        license_plate: vehicle.licensePlate || null,
        current_mileage: vehicle.currentMileage || 0,
        service_interval_months: vehicle.serviceIntervalMonths || null,
        service_interval_kilometers: vehicle.serviceIntervalKilometers || null,
        notes: vehicle.notes || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapVehicle(data);
  }

  async updateVehicle(accessToken: string, id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle> {
    const client = createAuthenticatedClient(accessToken);
    const updateData: Record<string, unknown> = {};
    
    if (vehicle.name !== undefined) updateData.name = vehicle.name;
    if (vehicle.make !== undefined) updateData.make = vehicle.make;
    if (vehicle.model !== undefined) updateData.model = vehicle.model;
    if (vehicle.year !== undefined) updateData.year = vehicle.year;
    if (vehicle.vin !== undefined) updateData.vin = vehicle.vin;
    if (vehicle.licensePlate !== undefined) updateData.license_plate = vehicle.licensePlate;
    if (vehicle.currentMileage !== undefined) updateData.current_mileage = vehicle.currentMileage;
    if (vehicle.serviceIntervalMonths !== undefined) updateData.service_interval_months = vehicle.serviceIntervalMonths;
    if (vehicle.serviceIntervalKilometers !== undefined) updateData.service_interval_kilometers = vehicle.serviceIntervalKilometers;
    if (vehicle.notes !== undefined) updateData.notes = vehicle.notes;

    const { data, error } = await client
      .from("vehicles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapVehicle(data);
  }

  async deleteVehicle(accessToken: string, id: number): Promise<void> {
    const client = createAuthenticatedClient(accessToken);
    const { error } = await client.from("vehicles").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getServices(accessToken: string, vehicleId: number): Promise<Service[]> {
    const client = createAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from("services")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false });

    if (error) throw new Error(error.message);
    return this.mapServices(data || []);
  }

  async createService(accessToken: string, service: InsertService): Promise<Service> {
    const client = createAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from("services")
      .insert({
        vehicle_id: service.vehicleId,
        date: service.date,
        mileage: service.mileage,
        type: service.type,
        cost: service.cost || null,
        notes: service.notes || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapService(data);
  }

  async deleteService(accessToken: string, id: number): Promise<void> {
    const client = createAuthenticatedClient(accessToken);
    const { error } = await client.from("services").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getReminders(accessToken: string, vehicleId: number): Promise<Reminder[]> {
    const client = createAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from("reminders")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("due_date", { ascending: true });

    if (error) throw new Error(error.message);
    return this.mapReminders(data || []);
  }

  async createReminder(accessToken: string, reminder: InsertReminder): Promise<Reminder> {
    const client = createAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from("reminders")
      .insert({
        vehicle_id: reminder.vehicleId,
        type: reminder.type,
        due_date: reminder.dueDate || null,
        due_mileage: reminder.dueMileage || null,
        recurring: reminder.recurring || false,
        interval_months: reminder.intervalMonths || null,
        interval_miles: reminder.intervalMiles || null,
        is_completed: reminder.isCompleted || false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapReminder(data);
  }

  async updateReminder(accessToken: string, id: number, reminder: Partial<InsertReminder>): Promise<Reminder> {
    const client = createAuthenticatedClient(accessToken);
    const updateData: Record<string, unknown> = {};

    if (reminder.type !== undefined) updateData.type = reminder.type;
    if (reminder.dueDate !== undefined) updateData.due_date = reminder.dueDate;
    if (reminder.dueMileage !== undefined) updateData.due_mileage = reminder.dueMileage;
    if (reminder.recurring !== undefined) updateData.recurring = reminder.recurring;
    if (reminder.intervalMonths !== undefined) updateData.interval_months = reminder.intervalMonths;
    if (reminder.intervalMiles !== undefined) updateData.interval_miles = reminder.intervalMiles;
    if (reminder.isCompleted !== undefined) updateData.is_completed = reminder.isCompleted;

    const { data, error } = await client
      .from("reminders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapReminder(data);
  }

  async deleteReminder(accessToken: string, id: number): Promise<void> {
    const client = createAuthenticatedClient(accessToken);
    const { error } = await client.from("reminders").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  private mapVehicle(row: Record<string, unknown>): Vehicle {
    return {
      id: row.id as number,
      userId: row.user_id as string,
      name: row.name as string,
      make: row.make as string,
      model: row.model as string,
      year: row.year as number,
      vin: row.vin as string | null,
      licensePlate: row.license_plate as string | null,
      currentMileage: row.current_mileage as number | null,
      serviceIntervalMonths: row.service_interval_months as number | null,
      serviceIntervalKilometers: row.service_interval_kilometers as number | null,
      notes: row.notes as string | null,
      createdAt: row.created_at ? new Date(row.created_at as string) : null,
    };
  }

  private mapVehicles(rows: Record<string, unknown>[]): Vehicle[] {
    return rows.map((row) => this.mapVehicle(row));
  }

  private mapService(row: Record<string, unknown>): Service {
    return {
      id: row.id as number,
      vehicleId: row.vehicle_id as number,
      date: new Date(row.date as string),
      mileage: row.mileage as number,
      type: row.type as string,
      cost: row.cost as number | null,
      notes: row.notes as string | null,
      createdAt: row.created_at ? new Date(row.created_at as string) : null,
    };
  }

  private mapServices(rows: Record<string, unknown>[]): Service[] {
    return rows.map((row) => this.mapService(row));
  }

  private mapReminder(row: Record<string, unknown>): Reminder {
    return {
      id: row.id as number,
      vehicleId: row.vehicle_id as number,
      type: row.type as string,
      dueDate: row.due_date ? new Date(row.due_date as string) : null,
      dueMileage: row.due_mileage as number | null,
      recurring: row.recurring as boolean | null,
      intervalMonths: row.interval_months as number | null,
      intervalMiles: row.interval_miles as number | null,
      isCompleted: row.is_completed as boolean | null,
      createdAt: row.created_at ? new Date(row.created_at as string) : null,
    };
  }

  private mapReminders(rows: Record<string, unknown>[]): Reminder[] {
    return rows.map((row) => this.mapReminder(row));
  }
}

export const supabaseStorage = new SupabaseStorage();
