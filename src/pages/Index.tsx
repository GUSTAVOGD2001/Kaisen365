import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Target, List } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Habit365
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Construye consistencia, rastrea tus hábitos diarios y alcanza tus metas
          </p>
          <div className="flex gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Comenzar
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg bg-card border border-border">
              <Calendar className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Calendario de 365 Días</h3>
              <p className="text-muted-foreground">
                Visualiza todo tu año de un vistazo. Marca cada día como completado y observa crecer tu progreso.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border">
              <List className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Rutinas Diarias</h3>
              <p className="text-muted-foreground">
                Crea y gestiona tus rutinas diarias. Mantente organizado con descripciones personalizadas y orden.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border">
              <Target className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Seguimiento de Metas</h3>
              <p className="text-muted-foreground">
                Establece metas ambiciosas con fechas objetivo. Monitorea tu progreso desde pendiente hasta completado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
