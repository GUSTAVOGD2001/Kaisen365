import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay } from "date-fns";

interface DayStatus {
  date: string;
  completed: boolean;
}

interface Calendar365Props {
  userId: string;
}

const Calendar365 = ({ userId }: Calendar365Props) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
  const allDaysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });

  useEffect(() => {
    fetchDayStatuses();
  }, [selectedYear, userId]);

  const fetchDayStatuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("day_status")
        .select("date, completed")
        .eq("user_id", userId)
        .gte("date", format(yearStart, "yyyy-MM-dd"))
        .lte("date", format(yearEnd, "yyyy-MM-dd"));

      if (error) throw error;
      setDayStatuses(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading calendar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingStatus = dayStatuses.find((s) => s.date === dateStr);
    const newCompleted = !existingStatus?.completed;

    try {
      const { error } = await supabase
        .from("day_status")
        .upsert({
          user_id: userId,
          date: dateStr,
          completed: newCompleted,
        });

      if (error) throw error;

      setDayStatuses((prev) => {
        const filtered = prev.filter((s) => s.date !== dateStr);
        return [...filtered, { date: dateStr, completed: newCompleted }];
      });

      toast({
        title: newCompleted ? "Day completed!" : "Day unmarked",
        description: format(date, "MMMM d, yyyy"),
      });
    } catch (error: any) {
      toast({
        title: "Error updating day",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markToday = () => {
    toggleDay(new Date());
  };

  const getWeekDays = (fromToday: boolean = true) => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (fromToday ? i : i - 6));
      days.push(date);
    }
    return days;
  };

  const markWeek = async () => {
    const weekDays = getWeekDays(true);
    for (const date of weekDays) {
      const dateStr = format(date, "yyyy-MM-dd");
      await supabase.from("day_status").upsert({
        user_id: userId,
        date: dateStr,
        completed: true,
      });
    }
    fetchDayStatuses();
    toast({ title: "Week marked as complete!" });
  };

  const clearWeek = async () => {
    const weekDays = getWeekDays(false);
    for (const date of weekDays) {
      const dateStr = format(date, "yyyy-MM-dd");
      await supabase.from("day_status").upsert({
        user_id: userId,
        date: dateStr,
        completed: false,
      });
    }
    fetchDayStatuses();
    toast({ title: "Week cleared!" });
  };

  const completedCount = dayStatuses.filter((s) => s.completed).length;
  const percentage = ((completedCount / 365) * 100).toFixed(1);

  // Calculate streak
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>365-Day Calendar</CardTitle>
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
            <span className="text-foreground font-semibold">{completedCount}</span>/365 days
          </span>
          <span>
            <span className="text-foreground font-semibold">{percentage}%</span> complete
          </span>
          <span>
            <span className="text-foreground font-semibold">{streak}</span> day streak
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" onClick={markToday}>
            Mark Today
          </Button>
          <Button size="sm" variant="secondary" onClick={markWeek}>
            Mark Week
          </Button>
          <Button size="sm" variant="secondary" onClick={clearWeek}>
            Clear Week
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading calendar...</div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(20px,1fr))] gap-1.5">
              {allDaysInYear.map((date) => {
                const completed = isDayCompleted(date);
                const isToday = isSameDay(date, new Date());

                return (
                  <Tooltip key={date.toISOString()}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleDay(date)}
                        className={`
                          aspect-square rounded-full transition-all hover:scale-110
                          ${completed ? "bg-success" : "bg-muted"}
                          ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                        `}
                        aria-label={format(date, "MMMM d, yyyy")}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{format(date, "MMMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">
                        {completed ? "Completed" : "Not completed"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default Calendar365;
