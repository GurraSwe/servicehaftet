import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type ReminderInput = z.infer<typeof api.reminders.create.input>;
type ReminderUpdate = z.infer<typeof api.reminders.update.input>;

export function useReminders(vehicleId: number) {
  return useQuery({
    queryKey: [api.reminders.list.path, vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];
      const url = buildUrl(api.reminders.list.path, { vehicleId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return api.reminders.list.responses[200].parse(await res.json());
    },
    enabled: !!vehicleId,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, ...data }: { vehicleId: number } & ReminderInput) => {
      const payload = {
        ...data,
        dueMileage: data.dueMileage ? Number(data.dueMileage) : undefined,
        intervalMiles: data.intervalMiles ? Number(data.intervalMiles) : undefined,
        intervalMonths: data.intervalMonths ? Number(data.intervalMonths) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };

      const url = buildUrl(api.reminders.create.path, { vehicleId });
      const res = await fetch(url, {
        method: api.reminders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create reminder");
      return api.reminders.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path, variables.vehicleId] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId, ...data }: { id: number, vehicleId: number } & ReminderUpdate) => {
      const payload = {
        ...data,
        dueMileage: data.dueMileage ? Number(data.dueMileage) : undefined,
        intervalMiles: data.intervalMiles ? Number(data.intervalMiles) : undefined,
        intervalMonths: data.intervalMonths ? Number(data.intervalMonths) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };
      
      const url = buildUrl(api.reminders.update.path, { id });
      const res = await fetch(url, {
        method: api.reminders.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update reminder");
      return api.reminders.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path, variables.vehicleId] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: number, vehicleId: number }) => {
      const url = buildUrl(api.reminders.delete.path, { id });
      const res = await fetch(url, { 
        method: api.reminders.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete reminder");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path, variables.vehicleId] });
    },
  });
}
