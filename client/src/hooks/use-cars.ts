import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Car, CarInput } from "@/lib/types";

const toNullableString = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

function normalizeCarPayload<T extends Partial<CarInput>>(input: T): any {
  const payload: any = { ...input };

  if (input.year) payload.year = Number(input.year);
  if (input.current_mileage !== undefined) payload.current_mileage = Number(input.current_mileage);
  if (input.service_interval_months !== undefined) payload.service_interval_months = input.service_interval_months ? Number(input.service_interval_months) : null;
  if (input.service_interval_kilometers !== undefined) payload.service_interval_kilometers = input.service_interval_kilometers ? Number(input.service_interval_kilometers) : null;

  payload.vin = toNullableString(input.vin);
  payload.license_plate = toNullableString(input.license_plate);
  payload.notes = toNullableString(input.notes);

  return payload;
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

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CarInput): Promise<Car> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = normalizeCarPayload(input);
      payload.user_id = user.id;

      console.log("CREATING CAR:", payload);

      const { data, error } = await supabase
        .from("cars")
        .insert(payload)
        .select();

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("No data returned on create");

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
      if (!id) throw new Error("Missing ID");

      const payload = normalizeCarPayload(input);
      console.log("UPDATING CAR:", id, payload);

      const { data, error } = await supabase
        .from("cars")
        .update(payload)
        .eq("id", id)
        .select();

      if (error) {
        console.error("UPDATE ERROR:", error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error("Update failed: No data returned. Check security policies.");
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
      console.log("DELETING CAR:", id);
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
