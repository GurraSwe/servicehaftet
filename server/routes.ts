import type { Express, Response } from "express";
import type { Server } from "http";
import { supabaseStorage, NotFoundError, ForbiddenError } from "./supabase-storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, registerAuthRoutes } from "./supabase-auth";

function handleStorageError(err: unknown, res: Response) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ message: err.message });
  }
  if (err instanceof ForbiddenError) {
    return res.status(403).json({ message: err.message });
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: err.errors[0].message,
      field: err.errors[0].path.join('.'),
    });
  }
  console.error("Storage error:", err);
  return res.status(500).json({ message: "Internal server error" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAuthRoutes(app);

  // --- Vehicles ---
  app.get(api.vehicles.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId!;
      const accessToken = req.accessToken!;
      const vehicles = await supabaseStorage.getVehicles(accessToken, userId);
      res.json(vehicles);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.get(api.vehicles.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      const vehicle = await supabaseStorage.getVehicle(accessToken, id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.post(api.vehicles.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.vehicles.create.input.parse(req.body);
      const userId = req.userId!;
      const accessToken = req.accessToken!;
      const vehicle = await supabaseStorage.createVehicle(accessToken, { ...input, userId });
      res.status(201).json(vehicle);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.put(api.vehicles.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      const input = api.vehicles.update.input.parse(req.body);
      const updated = await supabaseStorage.updateVehicle(accessToken, id, input);
      res.json(updated);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.delete(api.vehicles.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      await supabaseStorage.deleteVehicle(accessToken, id);
      res.status(204).send();
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  // --- Services ---
  app.get(api.services.list.path, isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const accessToken = req.accessToken!;
      const services = await supabaseStorage.getServices(accessToken, vehicleId);
      res.json(services);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.post(api.services.create.path, isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const accessToken = req.accessToken!;
      
      const body = { ...req.body, date: new Date(req.body.date) };
      const input = api.services.create.input.parse(body);
      const service = await supabaseStorage.createService(accessToken, { ...input, vehicleId });
      
      const vehicle = await supabaseStorage.getVehicle(accessToken, vehicleId);
      if (vehicle && service.mileage > (vehicle.currentMileage || 0)) {
        await supabaseStorage.updateVehicle(accessToken, vehicleId, { currentMileage: service.mileage });
      }

      res.status(201).json(service);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.delete(api.services.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      await supabaseStorage.deleteService(accessToken, id);
      res.status(204).send();
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  // --- Reminders ---
  app.get(api.reminders.list.path, isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const accessToken = req.accessToken!;
      const reminders = await supabaseStorage.getReminders(accessToken, vehicleId);
      res.json(reminders);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.post(api.reminders.create.path, isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const accessToken = req.accessToken!;
      
      const body = { ...req.body };
      if (body.dueDate) body.dueDate = new Date(body.dueDate);
      
      const input = api.reminders.create.input.parse(body);
      const reminder = await supabaseStorage.createReminder(accessToken, { ...input, vehicleId });
      res.status(201).json(reminder);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.put(api.reminders.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      
      const body = { ...req.body };
      if (body.dueDate) body.dueDate = new Date(body.dueDate);

      const input = api.reminders.update.input.parse(body);
      const updated = await supabaseStorage.updateReminder(accessToken, id, input);
      res.json(updated);
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  app.delete(api.reminders.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      await supabaseStorage.deleteReminder(accessToken, id);
      res.status(204).send();
    } catch (err) {
      handleStorageError(err, res);
    }
  });

  return httpServer;
}
