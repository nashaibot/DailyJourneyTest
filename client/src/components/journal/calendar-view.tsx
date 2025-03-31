import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

interface CalendarDay {
  date: string;
  entryId?: number;
}

interface CalendarViewProps {
  calendarData: CalendarDay[];
  year: number;
  month: number;
  isLoading?: boolean;
  onDayClick?: (entryId?: number) => void;
  showEmptyDays?: boolean;
}

export default function CalendarView({
  calendarData,
  year,
  month,
  isLoading = false,
  onDayClick,
  showEmptyDays = false
}: CalendarViewProps) {
  const [days, setDays] = useState<Array<Date | null>>([]);
  
  useEffect(() => {
    // Generate days for the month
    const monthDate = new Date(year, month - 1);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start, end });
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = start.getDay();
    
    // Create array with empty spots for days from previous month
    const calendarDays: Array<Date | null> = Array(firstDayOfWeek).fill(null);
    
    // Add the actual days of the month
    calendarDays.push(...daysInMonth);
    
    setDays(calendarDays);
  }, [year, month]);
  
  // Determine if a day has an entry
  const getDayEntry = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    return calendarData.find(item => item.date === formattedDate)?.entryId;
  };
  
  // Check if a date is today
  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2 animate-pulse">
        {/* Weekday labels */}
        <div className="text-center text-sm text-clay-600 mb-2">S</div>
        <div className="text-center text-sm text-clay-600 mb-2">M</div>
        <div className="text-center text-sm text-clay-600 mb-2">T</div>
        <div className="text-center text-sm text-clay-600 mb-2">W</div>
        <div className="text-center text-sm text-clay-600 mb-2">T</div>
        <div className="text-center text-sm text-clay-600 mb-2">F</div>
        <div className="text-center text-sm text-clay-600 mb-2">S</div>
        
        {/* Placeholder days */}
        {Array(35).fill(0).map((_, i) => (
          <div key={i} className="aspect-ratio-1/1 text-center p-2 rounded-md bg-clay-100"></div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Weekday labels */}
      <div className="text-center text-sm text-clay-600 mb-2">S</div>
      <div className="text-center text-sm text-clay-600 mb-2">M</div>
      <div className="text-center text-sm text-clay-600 mb-2">T</div>
      <div className="text-center text-sm text-clay-600 mb-2">W</div>
      <div className="text-center text-sm text-clay-600 mb-2">T</div>
      <div className="text-center text-sm text-clay-600 mb-2">F</div>
      <div className="text-center text-sm text-clay-600 mb-2">S</div>
      
      {/* Calendar days */}
      {days.map((day, index) => {
        if (!day) {
          // Empty day from previous month
          return (
            <div 
              key={`empty-${index}`} 
              className="calendar-day text-center p-2 text-clay-400 text-sm"
            ></div>
          );
        }
        
        const entryId = getDayEntry(day);
        const dayNumber = day.getDate();
        const dayIsToday = isToday(day);
        
        // Only show days with entries if showEmptyDays is false
        if (!showEmptyDays && !entryId) {
          return (
            <div 
              key={`day-${index}`} 
              className="calendar-day text-center rounded-md p-2 cursor-default bg-clay-100 opacity-60"
            >
              <span className="text-sm">{dayNumber}</span>
            </div>
          );
        }
        
        return (
          <div 
            key={`day-${index}`} 
            className={`calendar-day text-center rounded-md p-2 cursor-pointer ${
              dayIsToday 
                ? "bg-clay-800 text-white" 
                : entryId 
                  ? "bg-sage-400 text-white" 
                  : "bg-clay-200 text-clay-700"
            }`}
            onClick={() => onDayClick && onDayClick(entryId)}
          >
            <span className="text-sm">{dayNumber}</span>
          </div>
        );
      })}
    </div>
  );
}
