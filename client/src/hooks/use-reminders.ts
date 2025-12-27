import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Reminder, ReminderInput } from "@/lib/types";

// Fetch all reminders for a car
export function useReminders(carId: string | null) {
  return useQuery({
    queryKey: ["reminders", carId],
    queryFn: async () => {
      if (!carId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("car_id", carId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Reminder[];
    },
    enabled: !!carId,
  });
}

// Create a new reminder
export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReminderInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const reminderData = {
        ...input,
        user_id: user.id,
        recurring: input.recurring ?? false,
        is_completed: input.is_completed ?? false,
        notes: input.notes || null,
        due_date: input.due_date || null,
        due_mileage: input.due_mileage || null,
        interval_months: input.interval_months || null,
        interval_kilometers: input.interval_kilometers || null,
      };

      const { data, error } = await supabase
        .from("reminders")
        .insert(reminderData)
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders", variables.car_id] });
    },
  });
}

// Update a reminder
export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: ReminderInput & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reminders")
        .update(input)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

// Delete a reminder
export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

// Mark a reminder as completed
export function useCompleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reminders")
        .update({ is_completed: true })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

