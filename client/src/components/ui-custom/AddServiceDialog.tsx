import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/schema";
import { useCreateService } from "@/hooks/use-services";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { sv as svSE } from "date-fns/locale";
import { CalendarIcon, Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const serviceCategories = {
  "Oljeservice": ["Motorolja", "Oljefilter"],
  "Bromsservice": ["Bromsbelägg", "Bromsskivor", "Bromsvätska"],
  "Filter": ["Luftfilter", "Kupéfilter", "Bränslefilter"],
  "Tändsystem": ["Tändstift", "Tändspolar"],
  "Kylsystem": ["Kylvätskebyte", "Termostat", "Vattenpump"],
  "Chassi & slitdelar": ["Däckbyte (sommar/vinter)", "Däckrotation", "Hjulinställning", "Stötdämpare", "Fjädrar", "Hjullager"],
  "Drivlina": ["Växellådsolja (manuell / automat)", "Koppling", "Drivaxlar", "Differentialolja"],
  "El & elektronik": ["Batteribyte", "Generator", "Startmotor", "Lampor", "Säkringar"],
  "Vätskor & kontroller": ["Servoolja", "Spolarvätska", "AC-service (påfyllning / läcktest)", "Bromsvätskekontroll"],
  "Service & kontroller": ["Årlig service", "Inspektion", "Besiktning (för- / efterkontroll)", "Diagnos / felkoder (DTC)"],
  "Kaross & komfort": ["Rostskydd", "Vindruta", "Torkarblad", "Lås & gångjärn (smörjning)"]
};

const serviceTypes = Object.values(serviceCategories).flat();

const serviceItemSchema = z.object({
  type: z.string(),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type ServiceItem = z.infer<typeof serviceItemSchema>;

const formSchema = z.object({
  date: z.date(),
  mileage: z.coerce.number().min(0),
  items: z.array(serviceItemSchema).min(1, "Lägg till minst en serviceart"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddServiceDialogProps {
  vehicleId: number;
  currentMileage?: number;
}

export function AddServiceDialog({ vehicleId, currentMileage }: AddServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: createService, isPending } = useCreateService();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      mileage: currentMileage || 0,
      items: [{ type: "Motorolja", cost: 0, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const date = data.date;
      const mileage = data.mileage;

      // Create all service items
      for (const item of data.items) {
        const payload = {
          type: item.type,
          date,
          mileage,
          cost: item.cost ? Math.round(item.cost * 100) : undefined,
          notes: item.notes,
          vehicleId,
        };

        await new Promise((resolve, reject) => {
          createService(payload, {
            onSuccess: resolve,
            onError: reject,
          });
        });
      }

      toast({ title: "Service loggad framgångsrikt!" });
      setOpen(false);
      form.reset({
        date: new Date(),
        mileage: data.mileage,
        items: [{ type: "Motorolja", cost: 0, notes: "" }],
      });
    } catch (error: any) {
      toast({ 
        title: "Det gick inte att logga service", 
        description: error?.message || "Något gick fel",
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          <Plus className="w-4 h-4" /> Logga service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Logga service</DialogTitle>
          <DialogDescription>
            Registrera service- och underhållsarbete för bilen. Du kan lägga till flera åtgärder i samma servicepost.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: svSE })
                            ) : (
                              <span>Välj ett datum</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Körsträcka (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <FormLabel>Serviceåtgärder</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ type: "Motorolja", cost: 0, notes: "" })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Lägg till åtgärd
                </Button>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2 p-3 bg-background rounded border">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-sm">Åtgärd {index + 1}</FormLabel>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Typ av åtgärd</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Välj åtgärd" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(serviceCategories).map(([category, types]) => (
                                <SelectGroup key={category}>
                                  <SelectLabel>{category}</SelectLabel>
                                  {types.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.cost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Kostnad (kr)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div />
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Anteckningar</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detaljer om utfört arbete…" 
                              className="resize-none h-12 text-xs" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              <FormMessage>{form.formState.errors.items?.message}</FormMessage>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sparar..." : "Spara service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
