import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";

type ServiceInput = z.infer<typeof api.services.create.input>;

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const supabase = await getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { "Authorization": `Bearer ${session.access_token}` };
    }
  } catch (error) {
    console.error("Failed to get auth headers:", error);
  }
  return {};
}

export function useServices(vehicleId: number) {
  return useQuery({
    queryKey: [api.services.list.path, vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];
      const headers = await getAuthHeaders();
      const url = buildUrl(api.services.list.path, { vehicleId });
      const res = await fetch(url, { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      return api.services.list.responses[200].parse(await res.json());
    },
    enabled: !!vehicleId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, ...data }: { vehicleId: number } & ServiceInput) => {
      const authHeaders = await getAuthHeaders();
      const payload = {
        ...data,
        mileage: Number(data.mileage),
        cost: data.cost ? Number(data.cost) : undefined,
        date: new Date(data.date).toISOString() 
      };

      const url = buildUrl(api.services.create.path, { vehicleId });
      const res = await fetch(url, {
        method: api.services.create.method,
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
           const errorData = await res.json();
           console.error("Validation error:", errorData);
           throw new Error(errorData.message || "Validation failed");
        }
        throw new Error("Failed to log service");
      }
      return api.services.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path, variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: [api.vehicles.get.path, variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: number, vehicleId: number }) => {
      const authHeaders = await getAuthHeaders();
      const url = buildUrl(api.services.delete.path, { id });
      const res = await fetch(url, { 
        method: api.services.delete.method,
        headers: authHeaders,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete service log");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path, variables.vehicleId] });
    },
  });
}
