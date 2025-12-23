import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Car, CarInput } from "@/lib/types";
import { isValidUUID } from "@/lib/utils";

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
  const isValid = validId ? isValidUUID(validId) : false;
  
  return useQuery({
    queryKey: ["cars", validId],
    queryFn: async (): Promise<Car | null> => {
      if (!validId || !isValid) return null;
      
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", validId)
        .single();
      
      if (error) {
        // PGRST116 = no rows returned
        if (error.code === "PGRST116") return null;
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!validId && isValid,
    retry: false,
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CarInput): Promise<Car> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("cars")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
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
      if (!id || !isValidUUID(id)) {
        throw new Error("Invalid vehicle ID");
      }
      
      const { data, error } = await supabase
        .from("cars")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to update vehicle");
      
      return data;
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
      if (!id || !isValidUUID(id)) {
        throw new Error("Invalid vehicle ID");
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
