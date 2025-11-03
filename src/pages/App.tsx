import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Calendar365 from "@/components/Calendar365";
import RoutineList from "@/components/RoutineList";
import GoalsList from "@/components/GoalsList";
import Footer from "@/components/Footer";

const motivationalPhrases = [
  "Bienvenido de vuelta. La disciplina no negocia.",
  "Un día más, un día menos.",
  "No excuses. Execute.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "La diferencia entre el ordinario y el extraordinario es ese pequeño extra.",
  "Tu única competencia es quien fuiste ayer.",
  "No se trata de ser perfecto, se trata de ser mejor.",
  "El dolor que sientes hoy será la fuerza que sientes mañana.",
  "Los sueños no funcionan a menos que tú lo hagas.",
  "Cada día es una nueva oportunidad para mejorar.",
];

const AppPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      
      // Show motivational phrase on login
      if (event === "SIGNED_IN" && session) {
        const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
        setTimeout(() => {
          toast({
            title: "¡Bienvenido de vuelta!",
            description: randomPhrase,
            duration: 5000,
          });
        }, 500);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Kaizen365</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="routines">Rutinas</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Calendar365 userId={session.user.id} />
          </TabsContent>

          <TabsContent value="routines">
            <RoutineList userId={session.user.id} />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsList userId={session.user.id} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AppPage;
