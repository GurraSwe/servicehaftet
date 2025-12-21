import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCar } from "@/hooks/use-cars";
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
import { Plus, Crown } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  make: z.string().min(1, "Märke krävs"),
  model: z.string().min(1, "Modell krävs"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  current_mileage: z.coerce.number().min(0),
  vin: z.string().optional().nullable(),
  license_plate: z.string().optional().nullable(),
  service_interval_months: z.coerce.number().min(0).optional().nullable(),
  service_interval_kilometers: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVehicleDialogProps {
  vehicleCount?: number;
}

export function AddVehicleDialog({ vehicleCount = 0 }: AddVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { mutate: createCar, isPending } = useCreateCar();
  const { toast } = useToast();
  
  const hasReachedLimit = vehicleCount >= 1;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      vin: "",
      license_plate: "",
      current_mileage: 0,
      service_interval_months: null,
      service_interval_kilometers: null,
      notes: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createCar(data, {
      onSuccess: () => {
        toast({ title: "Bil tillagd framgångsrikt!" });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast({ 
          title: "Det gick inte att lägga till bil", 
          description: error.message,
          variant: "destructive" 
        });
      },
    });
  };

  if (hasReachedLimit) {
    return (
      <>
        <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
              <Plus className="w-4 h-4" /> Lägg till bil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Uppgradera till Premium
              </DialogTitle>
              <DialogDescription>
                Du har nått gränsen för gratisversionen (1 fordon).
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center">
              <div className="text-4xl font-bold mb-2">49 kr</div>
              <div className="text-muted-foreground">Engångsbetalning</div>
              <ul className="mt-6 text-left space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Obegränsat antal fordon
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Alla funktioner inkluderade
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Livstidsåtkomst
                </li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpgrade(false)}>Avbryt</Button>
              <Button className="gap-2" onClick={() => {
                toast({ title: "Tack för ditt intresse!", description: "Betalningsfunktionen kommer snart." });
                setShowUpgrade(false);
              }}>
                <Crown className="w-4 h-4" /> Uppgradera nu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
          <Plus className="w-4 h-4" /> Lägg till bil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Lägg till ny bil</DialogTitle>
          <DialogDescription>
            Ange bilens uppgifter för att börja spåra underhål.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Smeknamn</FormLabel>
                  <FormControl>
                    <Input placeholder="t.ex. Min dagliga bil" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                name="current_mileage"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="license_plate"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="service_interval_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviceintervall (månader)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="t.ex. 12" 
                        value={field.value ?? ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : Number(val));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_interval_kilometers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviceintervall (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="t.ex. 15000" 
                        value={field.value ?? ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : Number(val));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
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
                {isPending ? "Lägger till..." : "Lägg till bil"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
