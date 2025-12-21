import { useParams, Link, useLocation } from "wouter";
import { useVehicle } from "@/hooks/use-vehicles";
import { useServices } from "@/hooks/use-services";
import { useReminders } from "@/hooks/use-reminders";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Calendar, Gauge, Settings, PenTool, AlertTriangle } from "lucide-react";
import { AddServiceDialog } from "@/components/ui-custom/AddServiceDialog";
import { EditVehicleDialog } from "@/components/ui-custom/EditVehicleDialog";
import { ServiceItem } from "@/components/ui-custom/ServiceItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { sv as svSE } from "date-fns/locale";

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = Number(id);
  const [location] = useLocation();
  
  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(vehicleId);
  const { data: services, isLoading: servicesLoading } = useServices(vehicleId);

  if (vehicleLoading) return <DetailsSkeleton />;
  if (!vehicle) return <div className="p-8 text-center">Bil hittades inte</div>;

  // Calculate stats
  const totalSpent = services?.reduce((sum, s) => sum + (s.cost || 0), 0) || 0;
  const lastService = services && services.length > 0 
    ? services.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container py-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent">
              <ChevronLeft className="w-4 h-4 mr-1" /> Tillbaka till garage
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                {vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                <span className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold border border-border">
                  {vehicle.licensePlate || "Ingen registrering"}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <EditVehicleDialog vehicle={vehicle} />
              <AddServiceDialog vehicleId={vehicleId} currentMileage={vehicle.currentMileage || 0} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nuvarande körsträcka</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                {vehicle.currentMileage?.toLocaleString('sv-SE')} km
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totalt investerat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(totalSpent / 100).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Senaste service</CardTitle>
            </CardHeader>
            <CardContent>
              {lastService ? (
                <div>
                  <div className="text-lg font-bold truncate">{lastService.type}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(lastService.date), { addSuffix: true, locale: svSE })}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic">Ingen service registrerad ännu</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-6 mb-6">
            <TabsTrigger 
              value="history" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Servicehistorik
            </TabsTrigger>
            <TabsTrigger 
              value="reminders" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Påminnelser
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Anteckningar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            {servicesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : services?.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <PenTool className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">Ingen servicehistorik</h3>
                <p className="text-muted-foreground mb-6">Logga din första service eller underhållsåtgärd för bilen.</p>
                <AddServiceDialog vehicleId={vehicleId} currentMileage={vehicle.currentMileage || 0} />
              </div>
            ) : (
              services?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((service) => (
                  <ServiceItem key={service.id} service={service} />
                ))
            )}
          </TabsContent>
          
          <TabsContent value="reminders">
             <div className="bg-card rounded-xl border border-border p-8 text-center">
               <AlertTriangle className="w-12 h-12 text-accent/50 mx-auto mb-4" />
               <h3 className="text-lg font-semibold">Påminnelser kommer snart</h3>
               <p className="text-muted-foreground">
                 Den här funktionen hjälper dig att spåra kommande underhål baserat på körsträcka.
               </p>
             </div>
          </TabsContent>

          <TabsContent value="notes">
             <div className="bg-card rounded-xl border border-border p-6">
               <h3 className="font-semibold mb-4">Bilanteckningar</h3>
               <p className="text-muted-foreground whitespace-pre-wrap">
                 {vehicle.notes || "Ingen anteckningar tillagd för denna bil."}
               </p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-48 bg-card border-b border-border mb-8" />
      <div className="container">
        <Skeleton className="h-32 w-full mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
