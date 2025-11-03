import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, eachMonthOfInterval, isToday, isBefore, startOfDay } from "date-fns";

interface DayStatus {
  date: string;
  completed: boolean;
  note: string | null;
}

interface Calendar365Props {
  userId: string;
}

const Calendar365 = ({ userId }: Calendar365Props) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
  const allMonths = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  useEffect(() => {
    fetchDayStatuses();
  }, [selectedYear, userId]);

  const fetchDayStatuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("day_status")
        .select("date, completed, note")
        .eq("user_id", userId)
        .gte("date", format(yearStart, "yyyy-MM-dd"))
        .lte("date", format(yearEnd, "yyyy-MM-dd"));

      if (error) throw error;
      setDayStatuses(data || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar el calendario",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteToday = async () => {
    const today = new Date();
    const dateStr = format(today, "yyyy-MM-dd");

    try {
      const { error } = await supabase
        .from("day_status")
        .upsert({
          user_id: userId,
          date: dateStr,
          completed: true,
          note: noteText || null,
        });

      if (error) throw error;

      setDayStatuses((prev) => {
        const filtered = prev.filter((s) => s.date !== dateStr);
        return [...filtered, { date: dateStr, completed: true, note: noteText || null }];
      });

      toast({
        title: "¡Excelente trabajo!",
        description: "Has completado todas tus rutinas del día de hoy.",
      });

      setDialogOpen(false);
      setNoteText("");
    } catch (error: any) {
      toast({
        title: "Error al completar el día",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openCompleteDialog = () => {
    const today = new Date();
    const dateStr = format(today, "yyyy-MM-dd");
    const existingStatus = dayStatuses.find((s) => s.date === dateStr);
    
    if (existingStatus) {
      setNoteText(existingStatus.note || "");
    } else {
      setNoteText("");
    }
    
    setDialogOpen(true);
  };

  const completedCount = dayStatuses.filter((s) => s.completed).length;
  const percentage = ((completedCount / 365) * 100).toFixed(1);

  const calculateStreak = () => {
    const sorted = [...dayStatuses]
      .filter((s) => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sorted.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = format(checkDate, "yyyy-MM-dd");
      
      if (sorted.find((s) => s.date === dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const isDayCompleted = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return dayStatuses.find((s) => s.date === dateStr && s.completed);
  };

  const getDayNote = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return dayStatuses.find((s) => s.date === dateStr)?.note;
  };

  const getMonthDays = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return eachDayOfInterval({ start, end });
  };

  const getMonthName = (monthDate: Date) => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return monthNames[monthDate.getMonth()];
  };

  const todayStatus = dayStatuses.find((s) => s.date === format(new Date(), "yyyy-MM-dd"));
  const isTodayCompleted = todayStatus?.completed || false;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Calendario de 365 Días</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground mt-4">
          <span>
            <span className="text-foreground font-semibold">{completedCount}</span>/365 días
          </span>
          <span>
            <span className="text-foreground font-semibold">{percentage}%</span> completado
          </span>
          <span>
            <span className="text-foreground font-semibold">{streak}</span> días seguidos
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Button 
            size="lg" 
            onClick={openCompleteDialog}
            disabled={isTodayCompleted}
            className="w-full md:w-auto"
          >
            {isTodayCompleted ? "✓ Día completado" : "Completar día de hoy"}
          </Button>
          {isTodayCompleted && todayStatus?.note && (
            <p className="mt-2 text-sm text-muted-foreground">
              Nota: {todayStatus.note}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando calendario...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allMonths.map((monthDate) => {
              const monthDays = getMonthDays(monthDate);
              const monthName = getMonthName(monthDate);
              
              return (
                <div key={monthDate.toISOString()} className="border border-border rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2">{monthName}</h3>
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((date) => {
                      const completed = isDayCompleted(date);
                      const today = isToday(date);
                      const isPast = isBefore(startOfDay(date), startOfDay(new Date())) && !today;
                      const dayNote = getDayNote(date);
                      const dayNum = format(date, "d");

                      // Determinar color de fondo
                      let bgColor = "bg-muted text-muted-foreground"; // Días futuros o sin completar (presente)
                      
                      if (completed) {
                        bgColor = "bg-success text-success-foreground font-semibold"; // Días completados
                      } else if (isPast) {
                        bgColor = "bg-destructive text-destructive-foreground font-semibold"; // Días pasados no completados
                      }

                      return (
                        <div
                          key={date.toISOString()}
                          className={`
                            aspect-square flex items-center justify-center text-xs rounded
                            ${bgColor}
                            ${today ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                            ${dayNote ? "relative" : ""}
                            transition-all
                          `}
                          title={dayNote ? `${format(date, "dd/MM/yyyy")}\n${dayNote}` : format(date, "dd/MM/yyyy")}
                        >
                          {dayNum}
                          {dayNote && (
                            <span className="absolute top-0 right-0 w-1 h-1 bg-primary rounded-full"></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Completaste todas tus rutinas hoy?</DialogTitle>
            <DialogDescription>
              Marca este día como completado y opcionalmente agrega un comentario sobre tu progreso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Comentario (opcional)</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escribe cómo te fue hoy, qué aprendiste, o cualquier reflexión..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCompleteToday}>
              Sí, completé mis rutinas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Calendar365;
