import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Car, CarInput } from "@/lib/types";

// Helper function to clean data - convert empty strings to null
// This is critical to avoid 409 conflicts with unique constraints
function cleanCarData(data: any): any {
  const cleaned: any = { ...data };
  
  // Convert empty strings to null for optional fields (critical for license_plate unique constraint)
  // Empty strings are treated as values, NULL allows the unique constraint to work correctly
  if (cleaned.vin === "" || cleaned.vin === undefined || cleaned.vin === null) {
    cleaned.vin = null;
  }
  if (cleaned.license_plate === "" || cleaned.license_plate === undefined || cleaned.license_plate === null) {
    cleaned.license_plate = null;
  }
  if (cleaned.notes === "" || cleaned.notes === undefined || cleaned.notes === null) {
    cleaned.notes = null;
  }
  
  // Handle service interval fields - convert empty strings, undefined, 0, or null to null
  if (
    cleaned.service_interval_months === "" || 
    cleaned.service_interval_months === undefined || 
    cleaned.service_interval_months === null ||
    cleaned.service_interval_months === 0
  ) {
    cleaned.service_interval_months = null;
  } else if (typeof cleaned.service_interval_months === "string") {
    const parsed = parseInt(cleaned.service_interval_months, 10);
    cleaned.service_interval_months = isNaN(parsed) || parsed === 0 ? null : parsed;
  }
  
  if (
    cleaned.service_interval_kilometers === "" || 
    cleaned.service_interval_kilometers === undefined || 
    cleaned.service_interval_kilometers === null ||
    cleaned.service_interval_kilometers === 0
  ) {
    cleaned.service_interval_kilometers = null;
  } else if (typeof cleaned.service_interval_kilometers === "string") {
    const parsed = parseInt(cleaned.service_interval_kilometers, 10);
    cleaned.service_interval_kilometers = isNaN(parsed) || parsed === 0 ? null : parsed;
  }
  
  // Ensure year is a number
  if (typeof cleaned.year === "string") {
    cleaned.year = parseInt(cleaned.year, 10);
  }
  
  // Ensure current_mileage is a number (default to 0 if invalid)
  if (typeof cleaned.current_mileage === "string") {
    cleaned.current_mileage = parseInt(cleaned.current_mileage, 10) || 0;
  }
  if (cleaned.current_mileage === undefined || cleaned.current_mileage === null) {
    cleaned.current_mileage = 0;
  }
  
  // Remove any undefined values (they can cause issues)
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  
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

      if (error) {
        console.error("Error fetching cars:", error);
        throw error;
      }
      
      return (data || []) as Car[];
    },
    staleTime: 0, // Always consider data stale to ensure fresh fetches after mutations
    refetchOnMount: true, // Always refetch when component mounts
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

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Car | null;
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


      const { data, error } = await supabase
        .from("cars")
        .insert(carData)
        .select()
        .single();

      if (error) {
        console.error("Error creating car:", error);
        throw new Error(error.message || "Failed to create car");
      }

      if (!data) {
        throw new Error("No data returned from insert");
      }

      return data as Car;
    },
    onSuccess: (newCar) => {
      console.log("Car created successfully, updating cache. New car ID:", newCar.id);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData<Car[]>(["cars"], (oldCars) => {
        console.log("Updating cache. Old cars count:", oldCars?.length || 0);
        if (!oldCars) {
          console.log("No old cars, returning new car");
          return [newCar];
        }
        // Check if already exists (shouldn't happen, but safe)
        if (oldCars.some(car => car.id === newCar.id)) {
          console.log("Car already exists in cache, updating");
          return oldCars.map(car => car.id === newCar.id ? newCar : car);
        }
        // Add new car at the beginning (most recent first)
        const updated = [newCar, ...oldCars];
        console.log("Added new car to cache. New count:", updated.length);
        return updated;
      });
      
      // Set individual car cache
      queryClient.setQueryData(["car", newCar.id], newCar);
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      // Force immediate refetch of active queries
      queryClient.refetchQueries({ queryKey: ["cars"] });
    },
  });
}

// Update an existing car
export function useUpdateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CarInput & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const cleanedData = cleanCarData(input);

      // First verify car exists and belongs to user (avoid 406 error)
      const { data: existingCar, error: checkError } = await supabase
        .from("cars")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError || !existingCar) {
        throw new Error("Car not found or you don't have permission to update it");
      }

      // Update without .single() to avoid 406 error when no rows match
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
        throw new Error("Car not found or update failed");
      }

      const updatedCar = data[0] as Car;
      
      // Update cache immediately
      queryClient.setQueryData(["car", id], updatedCar);
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      
      return updatedCar;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car", variables.id] });
    },
  });
}

// Delete a car
export function useDeleteCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!id) throw new Error("Invalid car ID");


      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting car:", error);
        throw new Error(error.message || "Failed to delete car");
      }

      
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["car", id] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

