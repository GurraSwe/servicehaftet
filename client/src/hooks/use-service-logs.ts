import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ServiceLog, ServiceLogInput, ServiceItem, ServiceItemInput } from "@/lib/types";

// Fetch all service logs for a car
export function useServiceLogs(carId: string | null) {
  return useQuery({
    queryKey: ["service-logs", carId],
    queryFn: async () => {
      if (!carId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("car_id", carId)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return (data || []) as ServiceLog[];
    },
    enabled: !!carId,
  });
}

// Fetch a single service log
export function useServiceLog(id: string | null) {
  return useQuery({
    queryKey: ["service-log", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ServiceLog | null;
    },
    enabled: !!id,
  });
}

// Create a new service log
export function useCreateServiceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ServiceLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const serviceLogData = {
        ...input,
        user_id: user.id,
        total_cost: input.total_cost ?? 0,
        notes: input.notes || null,
      };

      const { data, error } = await supabase
        .from("service_logs")
        .insert(serviceLogData)
        .select()
        .single();

      if (error) throw error;
      return data as ServiceLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-logs", variables.car_id] });
    },
  });
}

// Delete a service log
export function useDeleteServiceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("service_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-logs"] });
    },
  });
}

// Fetch service items for a service log
export function useServiceItems(serviceLogId: string | null) {
  return useQuery({
    queryKey: ["service-items", serviceLogId],
    queryFn: async () => {
      if (!serviceLogId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_items")
        .select("*")
        .eq("service_log_id", serviceLogId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ServiceItem[];
    },
    enabled: !!serviceLogId,
  });
}

// Create a service item
export function useCreateServiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ServiceItemInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const itemData = {
        ...input,
        user_id: user.id,
        cost: input.cost ?? 0,
        description: input.description || null,
      };

      const { data, error } = await supabase
        .from("service_items")
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data as ServiceItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-items", variables.service_log_id] });
    },
  });
}

// Delete a service item
export function useDeleteServiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("service_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-items"] });
    },
  });
}

