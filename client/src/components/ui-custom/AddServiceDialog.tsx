import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/schema";
import { useCreateService } from "@/hooks/use-services";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { sv as svSE } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
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
import { useState } from "react";

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

const formSchema = insertServiceSchema.omit({ vehicleId: true }).extend({
  mileage: z.coerce.number().min(0),
  cost: z.coerce.number().optional(),
  date: z.date(),
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
      type: "Motorolja",
      date: new Date(),
      mileage: currentMileage || 0,
      cost: 0,
      notes: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      cost: data.cost ? Math.round(data.cost * 100) : undefined
    };

    createService({ vehicleId, ...payload }, {
      onSuccess: () => {
        toast({ title: "Service loggad framgångsrikt!" });
        setOpen(false);
        form.reset({
          type: "Motorolja",
          date: new Date(),
          mileage: data.mileage,
          cost: 0,
          notes: "",
        });
      },
      onError: (error) => {
        toast({ 
          title: "Det gick inte att logga service", 
          description: error.message,
          variant: "destructive" 
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          <Plus className="w-4 h-4" /> Logga service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Logga service</DialogTitle>
          <DialogDescription>
            Registrera underhållsdetaljer för din historia.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servictyp</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj typ" />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kostnad (kr)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                      placeholder="Detaljer om delar, mekaniker, iakttagelser..." 
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
                {isPending ? "Sparar..." : "Spara register"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
