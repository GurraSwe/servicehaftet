import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Car, CarInput } from "@/lib/types";

const toNullableString = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

function normalizeCarPayload<T extends Partial<CarInput>>(input: T): T {
  return {
    ...input,
    vin: toNullableString(input.vin ?? null) as T["vin"],
    license_plate: toNullableString(input.license_plate ?? null) as T["license_plate"],
    notes: toNullableString(input.notes ?? null) as T["notes"],
    service_interval_months:
      input.service_interval_months === undefined ? null : input.service_interval_months,
    service_interval_kilometers:
      input.service_interval_kilometers === undefined ? null : input.service_interval_kilometers,
  };
}

export function useCars() {
  return useQuery({
    queryKey: ["cars"],
    queryFn: async (): Promise<Car[]> => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw new Error(error.message);
      return data || [];
    },
  });
}

export function useCar(id: string | null | undefined) {
  const validId = id && id.trim() !== "" ? id : null;
  
  return useQuery({
    queryKey: ["cars", validId],
    queryFn: async (): Promise<Car | null> => {
      if (!validId) return null;
      
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", validId)
        .single();
      
      if (error) {
        // PGRST116 = no rows returned, 22P02 = invalid input syntax (e.g. malformed ID)
        if (error.code === "PGRST116" || error.code === "22P02") return null;
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!validId,
    retry: false,
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CarInput): Promise<Car> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const payload = normalizeCarPayload(input);
      // Ensure license_plate is explicitly null if empty to avoid unique constraint violations
      const insertData = {
        ...payload,
        user_id: user.id,
        license_plate: payload.license_plate || null,
        vin: payload.vin || null,
        notes: payload.notes || null,
      };
      const { data, error } = await supabase
        .from("cars")
        .insert(insertData)
        .select();
      
      if (error) {
        // Provide a more user-friendly error for unique constraint violations
        if (error.message.includes("unique constraint") || error.message.includes("duplicate")) {
          throw new Error("En bil med detta registreringsnummer finns redan. Var vänlig ange ett unikt registreringsnummer eller lämna fältet tomt.");
        }
        throw new Error(error.message || "Kunde inte skapa fordonet");
      }
      
      if (!data || data.length === 0) {
        throw new Error("Fordonet kunde inte skapas");
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CarInput>): Promise<Car> => {
      if (!id) {
        throw new Error("Ogiltigt fordon-ID");
      }
      
      const payload = normalizeCarPayload(input);
      const { data, error } = await supabase
        .from("cars")
        .update(payload)
        .eq("id", id)
        .select();
      
      if (error) {
        throw new Error(error.message || "Kunde inte uppdatera fordonet");
      }
      
      if (!data || data.length === 0) {
        throw new Error("Fordonet kunde inte hittas eller uppdateras");
      }
      
      if (data.length > 1) {
        console.warn("Multiple cars returned for single ID:", id);
      }
      
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["cars", data.id] });
    },
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!id) {
        throw new Error("Ogiltigt fordon-ID");
      }
      
      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", id);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}
