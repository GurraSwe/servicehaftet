import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Car, CarInput } from "@/lib/types";

// Helper function to clean data - convert empty strings to null
function cleanCarData(data: any): any {
  const cleaned: any = { ...data };
  
  // Convert empty strings to null for optional fields
  if (cleaned.vin === "" || cleaned.vin === undefined) cleaned.vin = null;
  if (cleaned.license_plate === "" || cleaned.license_plate === undefined) cleaned.license_plate = null;
  if (cleaned.notes === "" || cleaned.notes === undefined) cleaned.notes = null;
  
  // Handle service interval fields - convert empty strings, undefined, or 0 to null
  if (cleaned.service_interval_months === "" || cleaned.service_interval_months === undefined || cleaned.service_interval_months === 0) {
    cleaned.service_interval_months = null;
  } else if (typeof cleaned.service_interval_months === "string") {
    cleaned.service_interval_months = parseInt(cleaned.service_interval_months, 10) || null;
  }
  
  if (cleaned.service_interval_kilometers === "" || cleaned.service_interval_kilometers === undefined || cleaned.service_interval_kilometers === 0) {
    cleaned.service_interval_kilometers = null;
  } else if (typeof cleaned.service_interval_kilometers === "string") {
    cleaned.service_interval_kilometers = parseInt(cleaned.service_interval_kilometers, 10) || null;
  }
  
  // Ensure year is a number
  if (typeof cleaned.year === "string") {
    cleaned.year = parseInt(cleaned.year, 10);
  }
  
  // Ensure current_mileage is a number
  if (typeof cleaned.current_mileage === "string") {
    cleaned.current_mileage = parseInt(cleaned.current_mileage, 10) || 0;
  }
  
  return cleaned;
}

// Fetch all cars for the current user
export function useCars() {
  return useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Car[];
    },
  });
}

// Fetch a single car by ID
export function useCar(id: string | null) {
  return useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const carId = typeof id === "string" ? parseInt(id, 10) : id;
      if (isNaN(carId)) throw new Error("Invalid car ID");

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as Car;
    },
    enabled: !!id,
  });
}

// Create a new car
export function useCreateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CarInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const cleanedData = cleanCarData(input);
      
      const carData = {
        ...cleanedData,
        user_id: user.id,
      };

      console.log("CREATING CAR:", carData);

      const { data, error } = await supabase
        .from("cars")
        .insert(carData)
        .select();

      if (error) {
        console.error("Error creating car:", error);
        throw new Error(error.message || "Failed to create car");
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned from insert");
      }

      console.log("Car created successfully:", data[0]);
      return data[0] as Car;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

// Update an existing car
export function useUpdateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CarInput & { id: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const cleanedData = cleanCarData(input);

      console.log("UPDATING CAR:", { id, ...cleanedData });

      const { data, error } = await supabase
        .from("cars")
        .update(cleanedData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select();

      if (error) {
        console.error("Error updating car:", error);
        throw new Error(error.message || "Failed to update car");
      }

      if (!data || data.length === 0) {
        throw new Error("Car not found or you don't have permission to update it");
      }

      console.log("Car updated successfully:", data[0]);
      return data[0] as Car;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car", variables.id.toString()] });
    },
  });
}

// Delete a car
export function useDeleteCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const carId = typeof id === "string" ? parseInt(id, 10) : id;
      if (isNaN(carId)) throw new Error("Invalid car ID");

      console.log("DELETING CAR:", carId);

      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", carId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting car:", error);
        throw error;
      }

      console.log("Car deleted successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

