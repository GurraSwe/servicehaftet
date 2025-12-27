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
    year: input.year ? Number(input.year) : input.year,
    current_mileage: input.current_mileage !== undefined ? Number(input.current_mileage) : input.current_mileage,
    vin: toNullableString(input.vin ?? null) as T["vin"],
    license_plate: toNullableString(input.license_plate ?? null) as T["license_plate"],
    notes: toNullableString(input.notes ?? null) as T["notes"],
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

      if (error) {
        console.error("Error fetching cars:", error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });
}

export function useCar(id: string | null | undefined) {
  return useQuery({
    queryKey: ["cars", id],
    queryFn: async (): Promise<Car | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching car:", error);
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!id,
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
      const insertData = {
        ...payload,
        user_id: user.id,
        license_plate: payload.license_plate || null,
        vin: payload.vin || null,
        notes: payload.notes || null,
      };

      console.log("Attempting insert:", insertData);

      const { data, error } = await supabase
        .from("cars")
        .insert(insertData)
        .select();

      if (error) {
        console.error("Insert error:", error);
        if (error.message.includes("unique constraint") || error.message.includes("duplicate")) {
          throw new Error("En bil med detta registreringsnummer finns redan.");
        }
        throw new Error(error.message || "Kunde inte skapa fordonet");
      }

      if (!data || data.length === 0) {
        throw new Error("Fordonet kunde inte skapas (ingen data returnerades)");
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
      if (!id) throw new Error("Ogiltigt fordon-ID");

      const payload = normalizeCarPayload(input);
      console.log("Attempting update for ID:", id, payload);

      const { data, error } = await supabase
        .from("cars")
        .update(payload)
        .eq("id", id)
        .select();

      if (error) {
        console.error("Update error:", error);
        throw new Error(error.message || "Kunde inte uppdatera fordonet");
      }

      if (!data || data.length === 0) {
        throw new Error("Fordonet kunde inte hittas eller uppdateras. Kontrollera behörigheter.");
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
      if (!id) throw new Error("Ogiltigt fordon-ID");

      console.log("Attempting delete for ID:", id);

      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}
