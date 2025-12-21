import type { Express } from "express";
import type { Server } from "http";
import { supabaseStorage } from "./supabase-storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, registerAuthRoutes } from "./supabase-auth";

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
      console.error("Error fetching vehicles:", err);
      res.status(500).json({ message: "Failed to fetch vehicles" });
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
      console.error("Error fetching vehicle:", err);
      res.status(500).json({ message: "Failed to fetch vehicle" });
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error creating vehicle:", err);
      res.status(500).json({ message: "Failed to create vehicle" });
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error updating vehicle:", err);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete(api.vehicles.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      await supabaseStorage.deleteVehicle(accessToken, id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      res.status(500).json({ message: "Failed to delete vehicle" });
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
      console.error("Error fetching services:", err);
      res.status(500).json({ message: "Failed to fetch services" });
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error creating service:", err);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.delete(api.services.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      await supabaseStorage.deleteService(accessToken, id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting service:", err);
      res.status(500).json({ message: "Failed to delete service" });
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
      console.error("Error fetching reminders:", err);
      res.status(500).json({ message: "Failed to fetch reminders" });
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error creating reminder:", err);
      res.status(500).json({ message: "Failed to create reminder" });
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error updating reminder:", err);
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete(api.reminders.delete.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessToken = req.accessToken!;
      await supabaseStorage.deleteReminder(accessToken, id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting reminder:", err);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  return httpServer;
}
