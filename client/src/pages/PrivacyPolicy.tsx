import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function PrivacyPolicy() {
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
            <h1 className="font-display text-4xl font-bold">Integritetspolicy</h1>
            <p className="text-muted-foreground">Senast uppdaterad: {new Date().getFullYear()}</p>
          </div>

          <Card>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none py-8">
              <p>Vi värnar om din integritet. Denna app samlar endast in den information som krävs för att tjänsten ska fungera.</p>

              <h2>Vilken information lagras?</h2>
              <ul>
                <li>Inloggningsuppgifter via Supabase (e-post och användar-ID)</li>
                <li>Fordonsinformation som användaren själv lägger in (bil, miltal, servicehistorik)</li>
                <li>Servicepåminnelser kopplade till fordon</li>
              </ul>

              <h2>Hur används informationen?</h2>
              <ul>
                <li>För att visa och hantera servicehistorik</li>
                <li>För att skicka påminnelser när det är dags för service</li>
                <li>För att ge användaren tillgång till sitt konto</li>
              </ul>

              <h2>Delning av data</h2>
              <ul>
                <li>Ingen data delas med tredje part</li>
                <li>Ingen data säljs vidare</li>
                <li>Ingen e-postmarknadsföring</li>
              </ul>

              <h2>Lagring och säkerhet</h2>
              <ul>
                <li>All data lagras säkert via Supabase</li>
                <li>Varje användare har endast tillgång till sin egen data</li>
              </ul>

              <h2>Dina rättigheter</h2>
              <p>Användaren har rätt att begära utdrag eller radering av sin data.</p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Link href="/anvandarvillkor">
              <Button variant="outline">Läs användarvillkor</Button>
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

