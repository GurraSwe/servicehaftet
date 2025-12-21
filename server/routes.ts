import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
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
    const userId = req.userId!;
    const vehicles = await storage.getVehicles(userId);
    res.json(vehicles);
  });

  app.get(api.vehicles.get.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const vehicle = await storage.getVehicle(id);
    
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    const userId = req.userId!;
    if (vehicle.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(vehicle);
  });

  app.post(api.vehicles.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.vehicles.create.input.parse(req.body);
      const userId = req.userId!;
      const vehicle = await storage.createVehicle({ ...input, userId });
      res.status(201).json(vehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.vehicles.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const vehicle = await storage.getVehicle(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    
    const userId = req.userId!;
    if (vehicle.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    try {
      const input = api.vehicles.update.input.parse(req.body);
      const updated = await storage.updateVehicle(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.vehicles.delete.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const vehicle = await storage.getVehicle(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    
    const userId = req.userId!;
    if (vehicle.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteVehicle(id);
    res.status(204).send();
  });

  // --- Services ---
  app.get(api.services.list.path, isAuthenticated, async (req, res) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    
    const userId = req.userId!;
    if (vehicle.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    const services = await storage.getServices(vehicleId);
    res.json(services);
  });

  app.post(api.services.create.path, isAuthenticated, async (req, res) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    
    const userId = req.userId!;
    if (vehicle.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    try {
      const body = { ...req.body, date: new Date(req.body.date) };
      const input = api.services.create.input.parse(body);
      const service = await storage.createService({ ...input, vehicleId });
      
      if (service.mileage > (vehicle.currentMileage || 0)) {
        await storage.updateVehicle(vehicleId, { currentMileage: service.mileage });
      }

      res.status(201).json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.services.delete.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteService(id);
    res.status(204).send();
  });

  // --- Reminders ---
  app.get(api.reminders.list.path, isAuthenticated, async (req, res) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    
    const userId = req.userId!;
    if (vehicle.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    const reminders = await storage.getReminders(vehicleId);
    res.json(reminders);
  });

  app.post(api.reminders.create.path, isAuthenticated, async (req, res) => {
    const vehicleId = parseInt(req.params.vehicleId);
    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    
    const userId = req.userId!;
    if (vehicle.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    try {
      const body = { ...req.body };
      if (body.dueDate) body.dueDate = new Date(body.dueDate);
      
      const input = api.reminders.create.input.parse(body);
      const reminder = await storage.createReminder({ ...input, vehicleId });
      res.status(201).json(reminder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.reminders.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const body = { ...req.body };
      if (body.dueDate) body.dueDate = new Date(body.dueDate);

      const input = api.reminders.update.input.parse(body);
      const updated = await storage.updateReminder(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.reminders.delete.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteReminder(id);
    res.status(204).send();
  });

  return httpServer;
}
