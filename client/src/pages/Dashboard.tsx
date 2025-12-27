import { useAuth } from "@/hooks/use-auth";
import { useCars } from "@/hooks/use-cars";
import { CarCard } from "@/components/ui-custom/CarCard";
import { AddVehicleDialog } from "@/components/ui-custom/AddVehicleDialog";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Car } from "@/lib/types";
import { PushNotificationPrompt } from "@/components/ui-custom/PushNotificationPrompt";

export default function Dashboard() {
  const { logout, user } = useAuth();
  const { data: cars, isLoading, error, refetch } = useCars();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Debug logging
  console.log("Dashboard render - cars:", cars, "count:", cars?.length, "isLoading:", isLoading);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="font-display font-bold text-xl flex items-center gap-2">
            <span className="text-primary">Garage</span>
            <span className="text-muted-foreground text-sm font-normal hidden sm:inline-block">/ Min instrumentpanel</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 sm:py-10 space-y-6">
        <PushNotificationPrompt variant="banner" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight">Dina bilar</h2>
            <p className="text-muted-foreground mt-1">Hantera dina bilar, service och underhåll på ett ställe.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="border border-border rounded-lg p-1 flex items-center gap-1 bg-card">
              <Button 
                variant={view === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={view === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setView('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <AddVehicleDialog vehicleCount={cars?.length || 0} />
          </div>
        </div>

        {error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center text-destructive">
            <p>Det gick inte att ladda bilar. Försök igen senare.</p>
          </div>
        ) : cars?.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {cars?.map((car: Car) => (
              <CarCard key={car.id} vehicle={car} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border text-center">
      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
        <LayoutGrid className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold font-display mb-2">Inga bilar ännu</h3>
      <p className="text-muted-foreground max-w-sm mb-8">
        Lägg till din första bil för att börja spara servicehistorik och få påminnelser om underhåll.
      </p>
      <AddVehicleDialog vehicleCount={0} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border mb-8" />
      <div className="container">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
