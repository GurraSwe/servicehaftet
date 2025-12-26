import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Car, Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        queryClient.invalidateQueries();
        toast({
          title: "Inloggad!",
          description: "Välkommen tillbaka.",
        });
        setLocation("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Konto skapat!",
          description: "Kontrollera din e-post för att verifiera ditt konto.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Fel",
        description: error.message || "Något gick fel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-foreground">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="bg-primary rounded-lg p-1.5">
                  <Car className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight">ServiceHäftet</span>
              </div>
            </Link>
            
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tillbaka
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">
              {isLogin ? "Logga in" : "Skapa konto"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Logga in för att hantera dina fordon" 
                : "Registrera dig för att komma igång"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@epost.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minst 6 tecken"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit-auth"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Logga in" : "Skapa konto"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-auth-mode"
              >
                {isLogin 
                  ? "Har du inget konto? Registrera dig" 
                  : "Har du redan ett konto? Logga in"}
              </button>
              <p className="mt-4 text-xs text-muted-foreground">
                Genom att fortsätta godkänner du våra{" "}
                <Link href="/anvandarvillkor" className="underline hover:text-foreground">
                  användarvillkor
                </Link>{" "}
                och{" "}
                <Link href="/integritetspolicy" className="underline hover:text-foreground">
                  integritetspolicy
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
