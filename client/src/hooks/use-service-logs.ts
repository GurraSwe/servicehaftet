import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ServiceLog, ServiceLogInput, ServiceItem, ServiceItemInput } from "@/lib/types";

export function useServiceLogs(carId: string | null | undefined) {
  return useQuery({
    queryKey: ["service-logs", carId],
    queryFn: async (): Promise<ServiceLog[]> => {
      if (!carId) return [];

      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("car_id", carId)
        .order("date", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!carId,
    retry: false,
  });
}

export function useServiceLog(id: string | null | undefined) {
  return useQuery({
    queryKey: ["service-logs", "detail", id],
    queryFn: async (): Promise<ServiceLog | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
    retry: false,
  });
}

export function useCreateServiceLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServiceLogInput): Promise<ServiceLog> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_logs")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to create service log");

      // Update vehicle mileage
      await supabase
        .from("cars")
        .update({ current_mileage: input.mileage })
        .eq("id", input.car_id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-logs", variables.car_id] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

export function useDeleteServiceLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, carId }: { id: string; carId: string }): Promise<void> => {
      const { error } = await supabase
        .from("service_logs")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-logs", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

export function useServiceItems(serviceLogId: string | null | undefined) {
  return useQuery({
    queryKey: ["service-items", serviceLogId],
    queryFn: async (): Promise<ServiceItem[]> => {
      if (!serviceLogId) return [];

      const { data, error } = await supabase
        .from("service_items")
        .select("*")
        .eq("service_log_id", serviceLogId)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!serviceLogId,
    retry: false,
  });
}

async function recalculateServiceLogTotal(serviceLogId: string): Promise<void> {
  const { data: items, error: fetchError } = await supabase
    .from("service_items")
    .select("cost")
    .eq("service_log_id", serviceLogId);

  if (fetchError) return;

  const totalCost = (items || []).reduce((sum, item) => sum + (item.cost ?? 0), 0);

  await supabase
    .from("service_logs")
    .update({ total_cost: totalCost })
    .eq("id", serviceLogId);
}

export function useCreateServiceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServiceItemInput): Promise<ServiceItem> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_items")
        .insert({
          ...input,
          user_id: user.id,
          cost: input.cost ?? 0,
        })
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to create service item");

      await recalculateServiceLogTotal(input.service_log_id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-items", variables.service_log_id] });
      queryClient.invalidateQueries({ queryKey: ["service-logs"] });
    },
  });
}
