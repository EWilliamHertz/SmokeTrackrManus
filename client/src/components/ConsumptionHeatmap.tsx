import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConsumptionEntry {
  id: number;
  consumptionDate: Date;
  quantity: string | number;
  productId: number;
}

interface ConsumptionHeatmapProps {
  consumption: ConsumptionEntry[];
}

export default function ConsumptionHeatmap({ consumption }: ConsumptionHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const heatmapData = useMemo(() => {
    if (!consumption) return { days: [], maxIntensity: 0 };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate consumption by day
    const dailyConsumption: Record<string, number> = {};
    consumption.forEach(entry => {
      const date = new Date(entry.consumptionDate);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const dateKey = date.toISOString().split('T')[0];
        dailyConsumption[dateKey] = (dailyConsumption[dateKey] || 0) + parseFloat(entry.quantity as any);
      }
    });

    const maxIntensity = Math.max(...Object.values(dailyConsumption), 1);

    // Build calendar grid
    const days: Array<{ date: Date; consumption: number; intensity: number }> = [];
    
    // Add empty cells for days before the first day of month
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: new Date(0), consumption: 0, intensity: 0 });
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const consumption = dailyConsumption[dateKey] || 0;
      const intensity = consumption / maxIntensity;
      days.push({ date, consumption, intensity });
    }

    return { days, maxIntensity };
  }, [consumption, currentMonth]);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return "bg-muted";
    if (intensity < 0.25) return "bg-green-200 dark:bg-green-900/40";
    if (intensity < 0.5) return "bg-yellow-200 dark:bg-yellow-900/40";
    if (intensity < 0.75) return "bg-orange-300 dark:bg-orange-900/50";
    return "bg-red-400 dark:bg-red-900/60";
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Consumption Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-xs text-center text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1">
              {heatmapData.days.map((day, index) => {
                if (day.date.getTime() === 0) {
                  // Empty cell for padding
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        className={`aspect-square rounded-sm ${getIntensityColor(day.intensity)} border border-border flex items-center justify-center text-xs cursor-default transition-all hover:scale-110 hover:border-primary`}
                      >
                        <span className="text-foreground/70 font-medium">{day.date.getDate()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-semibold">
                          {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div>
                          {day.consumption > 0 
                            ? `${day.consumption.toFixed(1)} items consumed`
                            : 'No consumption'}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-sm bg-muted border border-border" />
              <div className="w-4 h-4 rounded-sm bg-green-200 dark:bg-green-900/40 border border-border" />
              <div className="w-4 h-4 rounded-sm bg-yellow-200 dark:bg-yellow-900/40 border border-border" />
              <div className="w-4 h-4 rounded-sm bg-orange-300 dark:bg-orange-900/50 border border-border" />
              <div className="w-4 h-4 rounded-sm bg-red-400 dark:bg-red-900/60 border border-border" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
