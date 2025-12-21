import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Car, ShieldCheck, History, Bell, ChevronRight, Wrench } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-1.5">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">ServiceHäftet</span>
            </div>
            
            <div className="flex items-center gap-4">
              {!isLoading && (
                isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button variant="default" className="font-semibold shadow-lg shadow-primary/20">
                      Gå till instrumentpanel
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={handleLogin} variant="default" className="font-semibold shadow-lg shadow-primary/20">
                    Logga in / Registrera
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative overflow-hidden py-20 sm:py-32">
          {/* Background decoration */}
          <div className="absolute inset-0 z-0">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50" />
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl opacity-50" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight mb-6">
                Ditt digitala <span className="text-gradient">servicehäfte</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                Håll koll på bilens underhåll och körsträcka och få automatiska servicepåminnelser.
                All servicehistorik samlad på ett och samma ställe – enkelt och smidigt.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  onClick={handleLogin} 
                  size="lg" 
                  className="text-lg h-14 px-8 rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300"
                >
                  Kom igång gratis <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg h-14 px-8 rounded-xl border-2 hover:bg-muted/50"
                >
                  Läs mer
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <History className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">Fullständig servicehistorik</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Glöm aldrig när du senast bytte olja eller vad som har servats.
                  Spara en tydlig och detaljerad historik över alla service- och underhållstillfällen.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-6 text-accent">
                  <Bell className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">Smarta påminnelser</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ställ in påminnelser baserade på datum eller miltal.
                  Du blir automatiskt påmind när det är dags för nästa service eller underhåll.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">Flera bilar</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Hantera flera bilar i ett och samma konto.
                  Perfekt för familjer, entusiaster och dig som har mer än ett fordon.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-70">
            <Car className="w-5 h-5" />
            <span className="font-display font-bold">ServiceHäftet</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            © 2025 ServiceHäftet
            Skapat för bilägare och entusiaster.
          </p>
        </div>
      </footer>
    </div>
  );
}
