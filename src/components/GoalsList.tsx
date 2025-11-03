import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Goal {
  id: number;
  title: string;
  description: string | null;
  target_date: string | null;
  status: "Pending" | "In Progress" | "Completed";
}

interface GoalsListProps {
  userId: string;
}

const GoalsList = ({ userId }: GoalsListProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<Goal["status"]>("Pending");

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals((data || []) as Goal[]);
    } catch (error: any) {
      toast({
        title: "Error al cargar las metas",
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
      if (editingGoal) {
        // Update existing goal
        const { error } = await supabase
          .from("goals")
          .update({
            title,
            description,
            target_date: targetDate || null,
            status,
          })
          .eq("id", editingGoal.id);

        if (error) throw error;
        toast({ title: "Meta actualizada correctamente" });
      } else {
        // Create new goal
        const { error } = await supabase.from("goals").insert({
          user_id: userId,
          title,
          description,
          target_date: targetDate || null,
          status,
        });

        if (error) throw error;
        toast({ title: "Meta creada correctamente" });
      }

      fetchGoals();
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error al guardar la meta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Meta eliminada correctamente" });
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error al eliminar la meta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetDate("");
    setStatus("Pending");
    setEditingGoal(null);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || "");
    setTargetDate(goal.target_date || "");
    setStatus(goal.status);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getStatusVariant = (status: Goal["status"]) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "Pending":
        return "outline";
    }
  };

  const translateStatus = (status: Goal["status"]) => {
    switch (status) {
      case "Completed":
        return "Completada";
      case "In Progress":
        return "En Progreso";
      case "Pending":
        return "Pendiente";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mis Metas</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Editar Meta" : "Nueva Meta"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Correr un maratón"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Completar un maratón completo de 42km..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-date">Fecha Objetivo</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Goal["status"])}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pendiente</SelectItem>
                      <SelectItem value="In Progress">En Progreso</SelectItem>
                      <SelectItem value="Completed">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingGoal ? "Actualizar" : "Crear"} Meta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando metas...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay metas aún. ¡Establece tu primera meta para comenzar!
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead>Fecha Objetivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.title}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {goal.description || "-"}
                    </TableCell>
                    <TableCell>
                      {goal.target_date ? format(new Date(goal.target_date), "d 'de' MMM, yyyy", { locale: es }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(goal.status)}>{translateStatus(goal.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(goal)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsList;
