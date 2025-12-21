import { Car, ChevronRight, Gauge, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { Car as CarType } from "@/lib/types";
import { format } from "date-fns";
import { sv as svSE } from "date-fns/locale";

interface CarCardProps {
  vehicle: CarType;
}

export function CarCard({ vehicle }: CarCardProps) {
  return (
    <Link href={`/vehicles/${vehicle.id}`} className="block group">
      <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Car size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                {vehicle.name}
              </h3>
              <p className="text-muted-foreground font-medium">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
            <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge size={16} className="text-primary" />
              <span>{vehicle.current_mileage?.toLocaleString('sv-SE')} km</span>
            </div>
            {vehicle.license_plate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold border border-border">
                  {vehicle.license_plate}
                </span>
              </div>
            )}
            <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground mt-2 border-t border-border pt-4">
              <Calendar size={14} />
              <span>Tillagd {format(new Date(vehicle.created_at || new Date()), "PPP", { locale: svSE })}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
