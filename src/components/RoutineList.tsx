import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react";

interface Routine {
  id: number;
  title: string;
  description: string | null;
  order_index: number;
}

interface RoutineListProps {
  userId: string;
}

const RoutineList = ({ userId }: RoutineListProps) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchRoutines();
  }, [userId]);

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", userId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar las rutinas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRoutine) {
        // Update existing routine
        const { error } = await supabase
          .from("routines")
          .update({ title, description })
          .eq("id", editingRoutine.id);

        if (error) throw error;
        toast({ title: "Rutina actualizada correctamente" });
      } else {
        // Create new routine
        const maxOrder = routines.length > 0 ? Math.max(...routines.map((r) => r.order_index)) : -1;
        const { error } = await supabase.from("routines").insert({
          user_id: userId,
          title,
          description,
          order_index: maxOrder + 1,
        });

        if (error) throw error;
        toast({ title: "Rutina creada correctamente" });
      }

      fetchRoutines();
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error al guardar la rutina",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Rutina eliminada correctamente" });
      fetchRoutines();
    } catch (error: any) {
      toast({
        title: "Error al eliminar la rutina",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const moveRoutine = async (id: number, direction: "up" | "down") => {
    const index = routines.findIndex((r) => r.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === routines.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newRoutines = [...routines];
    [newRoutines[index], newRoutines[newIndex]] = [newRoutines[newIndex], newRoutines[index]];

    // Update order_index for both
    try {
      await supabase.from("routines").update({ order_index: newIndex }).eq("id", newRoutines[newIndex].id);
      await supabase.from("routines").update({ order_index: index }).eq("id", newRoutines[index].id);
      fetchRoutines();
    } catch (error: any) {
      toast({
        title: "Error al reordenar las rutinas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEditingRoutine(null);
  };

  const openEditDialog = (routine: Routine) => {
    setEditingRoutine(routine);
    setTitle(routine.title);
    setDescription(routine.description || "");
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mis Rutinas</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Rutina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoutine ? "Editar Rutina" : "Nueva Rutina"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Meditación matutina"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="10 minutos de meditación consciente..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingRoutine ? "Actualizar" : "Crear"} Rutina
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando rutinas...</div>
        ) : routines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay rutinas aún. ¡Crea tu primera rutina para comenzar!
          </div>
        ) : (
          <div className="space-y-2">
            {routines.map((routine, index) => (
              <Card key={routine.id} className="bg-secondary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        onClick={() => moveRoutine(routine.id, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{routine.title}</h3>
                      {routine.description && (
                        <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(routine)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(routine.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoutineList;
