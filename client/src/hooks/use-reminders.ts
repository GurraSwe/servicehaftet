import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Reminder, ReminderInput } from "@/lib/types";
import { isValidUUID } from "@/lib/utils";

export function useReminders(carId: number | string | null | undefined) {
  const validId = carId ? (typeof carId === 'string' ? parseInt(carId, 10) : carId) : null;
  const isValidNumber = validId !== null && !isNaN(validId);

  return useQuery({
    queryKey: ["reminders", validId],
    queryFn: async (): Promise<Reminder[]> => {
      if (!isValidNumber) return [];

      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("car_id", validId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: isValidNumber,
    retry: false,
  });
}

export function useAllReminders() {
  return useQuery({
    queryKey: ["reminders", "all"],
    queryFn: async (): Promise<Reminder[]> => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReminderInput): Promise<Reminder> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!input.car_id) {
        throw new Error("Invalid vehicle ID");
      }

      const { data, error } = await supabase
        .from("reminders")
        .insert({
          ...input,
          user_id: user.id,
          recurring: input.recurring ?? false,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to create reminder");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders", variables.car_id] });
      queryClient.invalidateQueries({ queryKey: ["reminders", "all"] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, carId, ...input }: { id: number | string; carId: number | string } & Partial<ReminderInput> & { is_completed?: boolean }): Promise<Reminder> => {
      if (!id) {
        throw new Error("Invalid reminder ID");
      }
      if (!carId) {
        throw new Error("Invalid vehicle ID");
      }

      const { data, error } = await supabase
        .from("reminders")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to update reminder");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["reminders", "all"] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, carId }: { id: number | string; carId: number | string }): Promise<void> => {
      if (!id) {
        throw new Error("Invalid reminder ID");
      }
      if (!carId) {
        throw new Error("Invalid vehicle ID");
      }

      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["reminders", "all"] });
    },
  });
}

export function useCompleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, carId }: { id: number | string; carId: number | string }): Promise<Reminder> => {
      if (!id) {
        throw new Error("Invalid reminder ID");
      }
      if (!carId) {
        throw new Error("Invalid vehicle ID");
      }

      const { data, error } = await supabase
        .from("reminders")
        .update({ is_completed: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to complete reminder");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["reminders", "all"] });
    },
  });
}
