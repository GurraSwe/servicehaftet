import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="font-display font-bold text-lg">
            ServiceHäftet
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Till instrumentpanel</Button>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-3xl space-y-6 mx-auto">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Legal</p>
            <h1 className="font-display text-4xl font-bold">Användarvillkor</h1>
            <p className="text-muted-foreground">Senast uppdaterad: {new Date().getFullYear()}</p>
          </div>

          <Card>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none py-8">
              <p>Genom att använda appen godkänner användaren följande:</p>
              <ul>
                <li>Appen tillhandahålls i befintligt skick</li>
                <li>Användaren ansvarar själv för all information som matas in</li>
                <li>Appen är ett hjälpmedel och ersätter inte professionell rådgivning</li>
                <li>Funktioner kan ändras eller uppdateras över tid</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Link href="/integritetspolicy">
              <Button variant="outline">Läs integritetspolicy</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Tillbaka</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

