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

      console.log("CREATING CAR:", carData);

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

      console.log("Car created successfully:", data);
      
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.setQueryData(["car", data.id], data);
      
      return data as Car;
    },
    onSuccess: () => {
      // Force refetch of cars list
      queryClient.invalidateQueries({ queryKey: ["cars"] });
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

      console.log("UPDATING CAR:", { id, ...cleanedData });

      // First update without select to avoid 406 error
      const { error: updateError } = await supabase
        .from("cars")
        .update(cleanedData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating car:", updateError);
        throw new Error(updateError.message || "Failed to update car");
      }

      // Then fetch the updated car
      const { data, error: fetchError } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching updated car:", fetchError);
        throw new Error(fetchError.message || "Failed to fetch updated car");
      }

      if (!data) {
        throw new Error("Car not found or you don't have permission to update it");
      }

      console.log("Car updated successfully:", data);
      
      // Update cache immediately
      queryClient.setQueryData(["car", id], data);
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      
      return data as Car;
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

      console.log("DELETING CAR:", id);

      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting car:", error);
        throw new Error(error.message || "Failed to delete car");
      }

      console.log("Car deleted successfully");
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["car", id] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

