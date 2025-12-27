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

      console.log("Fetching cars for user:", user.id);

      // Fetch with user_id filter
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching cars:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        throw error;
      }
      
      console.log("Fetched cars:", data?.length || 0, "cars");
      console.log("Raw response data:", data);
      
      if (data && data.length > 0) {
        console.log("Car IDs:", data.map(c => c.id));
      } else {
        console.warn("⚠️ No cars returned even though car exists in database!");
        console.warn("This indicates RLS is blocking the query or policies are still active.");
      }
      
      return (data || []) as Car[];
    },
    staleTime: 0, // Always consider data stale to ensure fresh fetches after mutations
    gcTime: 0, // Don't cache in background (formerly cacheTime)
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
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

      console.log("Creating car with user_id:", user.id, "data:", carData);

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
        console.error("No data returned from insert - this is unusual!");
        throw new Error("No data returned from insert");
      }

      console.log("Car created successfully! ID:", data.id, "user_id:", (data as any).user_id);
      
      // Verify the car can be fetched by ID
      const { data: verifyData, error: verifyError } = await supabase
        .from("cars")
        .select("*")
        .eq("id", data.id)
        .single();
        
      if (verifyError) {
        console.error("Error verifying car:", verifyError);
      } else if (!verifyData) {
        console.error("WARNING: Car was created but cannot be fetched!");
      } else {
        console.log("Car verified - exists in database with ID:", verifyData.id);
      }

      return data as Car;
    },
    onSuccess: async (newCar) => {
      console.log("Mutation success - updating cache");
      
      // Optimistically update the cars list cache
      queryClient.setQueryData(["cars"], (oldCars: Car[] | undefined) => {
        if (!oldCars) return [newCar];
        return [newCar, ...oldCars];
      });
      
      // Set individual car cache
      queryClient.setQueryData(["car", newCar.id], newCar);
      
      // Invalidate and refetch to ensure server consistency
      await queryClient.invalidateQueries({ queryKey: ["cars"], exact: false });
      await queryClient.refetchQueries({ queryKey: ["cars"], exact: false });
      
      console.log("Cache updated and refetched");
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
      
      return updatedCar;
    },
    onSuccess: async (updatedCar, variables) => {
      console.log("Update success - updating cache");
      
      // Optimistically update the cars list cache
      queryClient.setQueryData(["cars"], (oldCars: Car[] | undefined) => {
        if (!oldCars) return [updatedCar];
        return oldCars.map(car => car.id === variables.id ? updatedCar : car);
      });
      
      // Update individual car cache
      queryClient.setQueryData(["car", variables.id], updatedCar);
      
      // Invalidate and refetch to ensure server consistency
      await queryClient.invalidateQueries({ queryKey: ["cars"], exact: false });
      await queryClient.refetchQueries({ queryKey: ["cars"], exact: false });
      
      console.log("Cache updated and refetched");
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

      return id;
    },
    onSuccess: async (deletedId) => {
      console.log("Delete success - updating cache");
      
      // Optimistically remove from cars list cache
      queryClient.setQueryData(["cars"], (oldCars: Car[] | undefined) => {
        if (!oldCars) return [];
        return oldCars.filter(car => car.id !== deletedId);
      });
      
      // Remove individual car cache
      queryClient.removeQueries({ queryKey: ["car", deletedId], exact: false });
      
      // Invalidate and refetch to ensure server consistency
      await queryClient.invalidateQueries({ queryKey: ["cars"], exact: false });
      await queryClient.refetchQueries({ queryKey: ["cars"], exact: false });
      
      console.log("Cache updated and refetched");
    },
  });
}

