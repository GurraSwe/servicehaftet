import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ServiceLog, ServiceLogInput, ServiceItem, ServiceItemInput } from "@/lib/types";
import { isValidUUID } from "@/lib/utils";

export function useServiceLogs(carId: number | string | null | undefined) {
  const validId = carId ? (typeof carId === 'string' ? parseInt(carId, 10) : carId) : null;
  const isValidNumber = validId !== null && !isNaN(validId);

  return useQuery({
    queryKey: ["service-logs", validId],
    queryFn: async (): Promise<ServiceLog[]> => {
      if (!isValidNumber) return [];

      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("car_id", validId)
        .order("date", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: isValidNumber,
    retry: false,
  });
}

export function useServiceLog(id: number | string | null | undefined) {
  const validId = id ? (typeof id === 'string' ? parseInt(id, 10) : id) : null;
  const isValidNumber = validId !== null && !isNaN(validId);

  return useQuery({
    queryKey: ["service-logs", "detail", validId],
    queryFn: async (): Promise<ServiceLog | null> => {
      if (!isValidNumber) return null;

      const { data, error } = await supabase
        .from("service_logs")
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
    enabled: isValidNumber,
    retry: false,
  });
}

export function useCreateServiceLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServiceLogInput): Promise<ServiceLog> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!input.car_id) {
        throw new Error("Invalid vehicle ID");
      }

      // Build insert object - exclude total_cost if column doesn't exist in DB
      const { total_cost, ...restInput } = input;
      const insertData: any = {
        ...restInput,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("service_logs")
        .insert(insertData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to create service log");

      // Update vehicle mileage if provided (non-blocking, but log errors)
      if (input.mileage != null && input.mileage >= 0) {
        const { error: updateError } = await supabase
          .from("cars")
          .update({ current_mileage: input.mileage })
          .eq("id", input.car_id);

        if (updateError) {
          console.error("Failed to update vehicle mileage:", updateError);
          // Don't throw - service log was created successfully
        }
      }

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
    mutationFn: async ({ id, carId }: { id: number | string; carId: number | string }): Promise<void> => {
      if (!id) {
        throw new Error("Invalid service log ID");
      }
      if (!carId) {
        throw new Error("Invalid vehicle ID");
      }

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

export function useServiceItems(serviceLogId: number | string | null | undefined) {
  const validId = serviceLogId ? (typeof serviceLogId === 'string' ? parseInt(serviceLogId, 10) : serviceLogId) : null;
  const isValidNumber = validId !== null && !isNaN(validId);

  return useQuery({
    queryKey: ["service-items", validId],
    queryFn: async (): Promise<ServiceItem[]> => {
      if (!isValidNumber) return [];

      const { data, error } = await supabase
        .from("service_items")
        .select("*")
        .eq("service_log_id", validId)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: isValidNumber,
    retry: false,
  });
}

async function recalculateServiceLogTotal(serviceLogId: number | string): Promise<void> {
  if (!serviceLogId) {
    throw new Error("Invalid service log ID");
  }

  const { data: items, error: fetchError } = await supabase
    .from("service_items")
    .select("cost")
    .eq("service_log_id", serviceLogId);

  if (fetchError) throw new Error(fetchError.message);

  const totalCost = (items || []).reduce((sum, item) => sum + (item.cost ?? 0), 0);

  // Try to update total_cost, but don't fail if column doesn't exist
  // The total_cost column may not exist in the database schema
  const { error: updateError } = await supabase
    .from("service_logs")
    .update({ total_cost: totalCost })
    .eq("id", serviceLogId);

  // Silently ignore errors related to missing column - total_cost is optional
  // and calculated client-side from service_items anyway
  if (updateError) {
    const errorMsg = updateError.message.toLowerCase();
    if (errorMsg.includes("column") || errorMsg.includes("total_cost") || errorMsg.includes("does not exist")) {
      // Column doesn't exist - this is okay, we calculate total client-side
      return;
    }
    // Other errors should still be thrown
    throw new Error(updateError.message);
  }
}

export function useCreateServiceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServiceItemInput): Promise<ServiceItem> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!input.service_log_id) {
        throw new Error("Invalid service log ID");
      }

      const { data, error } = await supabase
        .from("service_items")
        .insert({
          ...input,
          user_id: user.id,
          cost: input.cost ?? 0,
        })
        .select()
        .single();

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

export function useDeleteServiceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, serviceLogId }: { id: number | string; serviceLogId: number | string }): Promise<void> => {
      if (!id) {
        throw new Error("Invalid service item ID");
      }
      if (!serviceLogId) {
        throw new Error("Invalid service log ID");
      }

      const { error } = await supabase
        .from("service_items")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);

      await recalculateServiceLogTotal(serviceLogId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-items", variables.serviceLogId] });
      queryClient.invalidateQueries({ queryKey: ["service-logs"] });
    },
  });
}
