import { useParams, Link, useLocation } from "wouter";
import { useCar } from "@/hooks/use-cars";
import { useServiceLogs } from "@/hooks/use-service-logs";
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
import type { ServiceLog } from "@/lib/types";

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id || null;
  const [location] = useLocation();
  
  const { data: vehicle, isLoading: vehicleLoading, error: vehicleError } = useCar(vehicleId);
  const { data: serviceLogs, isLoading: servicesLoading, error: serviceLogsError } = useServiceLogs(vehicleId);

  if (vehicleLoading) return <DetailsSkeleton />;
  
  if (vehicleError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2 text-destructive">Fel vid laddning</h2>
          <p className="text-muted-foreground mb-4">
            {vehicleError instanceof Error ? vehicleError.message : "Ett oväntat fel uppstod"}
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Tillbaka till garage</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Bil hittades inte</h2>
          <p className="text-muted-foreground mb-4">
            Bilen med den angivna ID:n kunde inte hittas eller så har du inte behörighet att se den.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Tillbaka till garage</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = serviceLogs?.reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0;
  const lastService = serviceLogs && serviceLogs.length > 0 
    ? serviceLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
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
                  {vehicle.license_plate || "Ingen registrering"}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <EditVehicleDialog vehicle={vehicle} />
              <AddServiceDialog vehicleId={vehicle.id} currentMileage={vehicle.current_mileage || 0} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nuvarande körsträcka</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                {vehicle.current_mileage?.toLocaleString('sv-SE')} km
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totalt investerat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalSpent.toLocaleString('sv-SE')} kr
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
                  <div className="text-lg font-bold truncate">Service</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(lastService.date), { addSuffix: true, locale: svSE })}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic">Ingen service registrerad ännu</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Serviceintervall</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.service_interval_months || vehicle.service_interval_kilometers ? (
                <div className="text-lg font-bold">
                  {vehicle.service_interval_months && vehicle.service_interval_kilometers ? (
                    <>
                      {vehicle.service_interval_months} mån / {vehicle.service_interval_kilometers.toLocaleString('sv-SE')} km
                    </>
                  ) : vehicle.service_interval_months ? (
                    <>{vehicle.service_interval_months} månader</>
                  ) : (
                    <>{vehicle.service_interval_kilometers?.toLocaleString('sv-SE')} km</>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground italic">Ej inställt</div>
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
            ) : serviceLogsError ? (
              <div className="text-center py-20 bg-destructive/10 border border-destructive/20 rounded-xl">
                <PenTool className="w-12 h-12 text-destructive/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-destructive mb-2">Fel vid laddning av servicehistorik</h3>
                <p className="text-muted-foreground mb-6">
                  {serviceLogsError instanceof Error ? serviceLogsError.message : "Ett oväntat fel uppstod"}
                </p>
              </div>
            ) : !serviceLogs || serviceLogs.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <PenTool className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">Ingen servicehistorik</h3>
                <p className="text-muted-foreground mb-6">Logga din första service eller underhållsåtgärd för bilen.</p>
                <AddServiceDialog vehicleId={vehicle.id} currentMileage={vehicle.current_mileage || 0} />
              </div>
            ) : (
              serviceLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((serviceLog: ServiceLog) => (
                  <ServiceItem key={serviceLog.id} service={serviceLog} />
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
