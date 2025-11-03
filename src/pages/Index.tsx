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
            Build consistency, track your daily habits, and achieve your goals
          </p>
          <div className="flex gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
              Login
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg bg-card border border-border">
              <Calendar className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">365-Day Calendar</h3>
              <p className="text-muted-foreground">
                Visualize your entire year at a glance. Mark each day as complete and watch your progress grow.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border">
              <List className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Daily Routines</h3>
              <p className="text-muted-foreground">
                Create and manage your daily routines. Stay organized with custom descriptions and ordering.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border">
              <Target className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Track Goals</h3>
              <p className="text-muted-foreground">
                Set ambitious goals with target dates. Monitor your progress from pending to completed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
