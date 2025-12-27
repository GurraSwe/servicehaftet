import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Reminder, ReminderInput } from "@/lib/types";

export function useReminders(carId: string | null | undefined) {
  return useQuery({
    queryKey: ["reminders", carId],
    queryFn: async (): Promise<Reminder[]> => {
      if (!carId) return [];

      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!carId,
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

      const { data, error } = await supabase
        .from("reminders")
        .insert({
          ...input,
          user_id: user.id,
          recurring: input.recurring ?? false,
          is_completed: false,
        })
        .select()
        .maybeSingle();

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
    mutationFn: async ({ id, carId, ...input }: { id: string; carId: string } & Partial<ReminderInput> & { is_completed?: boolean }): Promise<Reminder> => {
      const { data, error } = await supabase
        .from("reminders")
        .update(input)
        .eq("id", id)
        .select()
        .maybeSingle();

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
    mutationFn: async ({ id, carId }: { id: string; carId: string }): Promise<void> => {
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
