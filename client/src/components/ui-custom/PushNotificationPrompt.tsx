import { AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type Variant = "card" | "banner";

export function PushNotificationPrompt({ variant = "card" }: { variant?: Variant }) {
  const { status, isSupported, enableNotifications, error } = usePushNotifications();
  const isPending = status === "pending";
  const permissionDenied = status === "denied";

  if (!isSupported || status === "granted") {
    return null;
  }

  if (permissionDenied) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm flex items-center gap-3 text-muted-foreground">
        <AlertTriangle className="w-5 h-5 text-accent" />
        <div>
          <p className="font-semibold">Pushnotiser blockerade</p>
          <p>Uppdatera webbläsarens inställningar för att tillåta servicepåminnelser.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-dashed border-primary/40 bg-primary/5 rounded-3xl p-5 flex flex-col gap-3",
        variant === "banner" && "rounded-2xl md:flex-row md:items-center md:justify-between",
      )}
    >
      <div className="flex gap-3">
        <div className="bg-primary text-primary-foreground rounded-2xl p-3 h-fit">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <p className="font-display font-semibold text-lg">Aktivera servicepåminnelser</p>
          <p className="text-muted-foreground text-sm">
            Få en pushnotis när det är dags för nästa service. Tillgängligt på Android och Chrome.
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            <span>Vi delar aldrig data med tredje part. Läs mer i </span>
            <Link href="/integritetspolicy" className="underline font-medium">
              Integritetspolicy
            </Link>
            .
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <Button onClick={enableNotifications} disabled={isPending} className="w-full md:w-auto">
          {isPending ? "Aktiverar..." : "Aktivera pushnotiser"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

