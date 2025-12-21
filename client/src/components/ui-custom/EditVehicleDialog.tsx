import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, Vehicle } from "@shared/schema";
import { useUpdateVehicle } from "@/hooks/use-vehicles";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";
import { useState } from "react";

const formSchema = insertVehicleSchema.extend({
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  currentMileage: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface EditVehicleDialogProps {
  vehicle: Vehicle;
}

export function EditVehicleDialog({ vehicle }: EditVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: updateVehicle, isPending } = useUpdateVehicle();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: vehicle.name || "",
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin || "",
      licensePlate: vehicle.licensePlate || "",
      currentMileage: vehicle.currentMileage || 0,
      notes: vehicle.notes || "",
    },
  });

  const onSubmit = (data: FormValues) => {
    updateVehicle({ id: vehicle.id, ...data }, {
      onSuccess: () => {
        toast({ title: "Bil uppdaterad framgångsrikt!" });
        setOpen(false);
      },
      onError: (error) => {
        toast({ 
          title: "Det gick inte att uppdatera bil", 
          description: error.message,
          variant: "destructive" 
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:flex" data-testid="button-edit-vehicle">
          <Settings className="w-4 h-4 mr-2" /> Redigera bil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Redigera bil</DialogTitle>
          <DialogDescription>
            Uppdatera bilens uppgifter.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Smeknamn (valfritt)</FormLabel>
                  <FormControl>
                    <Input placeholder="t.ex. Min dagliga bil" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Märke</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modell</FormLabel>
                    <FormControl>
                      <Input placeholder="Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>År</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentMileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuvarande körsträcka (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registreringsskyllt</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-123" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Valfritt" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anteckningar</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Några specifika detaljer om denna bil..." 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Uppdaterar..." : "Uppdatera bil"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
