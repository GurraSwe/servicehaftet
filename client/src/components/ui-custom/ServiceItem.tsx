import { format } from "date-fns";
import { sv as svSE } from "date-fns/locale";
import { type Service } from "@shared/schema";
import { Wrench, Droplet, Disc, AlertCircle, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteService } from "@/hooks/use-services";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ServiceItemProps {
  service: Service;
}

const getIconForType = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("olje")) return <Droplet className="w-5 h-5 text-amber-500" />;
  if (t.includes("brom")) return <Disc className="w-5 h-5 text-red-500" />;
  if (t.includes("däck")) return <Disc className="w-5 h-5 text-slate-500" />;
  if (t.includes("reparation")) return <Wrench className="w-5 h-5 text-blue-500" />;
  return <Wrench className="w-5 h-5 text-primary" />;
};

export function ServiceItem({ service }: ServiceItemProps) {
  const { mutate: deleteService, isPending } = useDeleteService();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteService({ id: service.id, vehicleId: service.vehicleId }, {
      onSuccess: () => {
        toast({ title: "Serviceregister raderat" });
      },
      onError: () => {
        toast({ title: "Det gick inte att radera registret", variant: "destructive" });
      }
    });
  };

  return (
    <div className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
          {getIconForType(service.type)}
        </div>
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
          <h4 className="font-semibold text-lg text-foreground truncate">{service.type}</h4>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {format(new Date(service.date), "PPP", { locale: svSE })}
          </span>
        </div>
        
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="font-medium text-foreground">{service.mileage.toLocaleString('sv-SE')}</span> km
          </span>
          {service.cost && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium text-xs">
              {(service.cost / 100).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
            </span>
          )}
        </div>

        {service.notes && (
          <div className="mt-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg flex gap-2 items-start">
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
            <p className="line-clamp-2">{service.notes}</p>
          </div>
        )}
      </div>

      <div className="flex sm:flex-col justify-end sm:items-center gap-2 mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Radera serviceregister?</AlertDialogTitle>
              <AlertDialogDescription>
                Den här åtgärden kan inte ångras. Det raderar detta serviceregister från din historia.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Radera
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
