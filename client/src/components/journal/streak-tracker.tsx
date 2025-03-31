import { isSameDay, format, subDays } from "date-fns";
import { Loader2 } from "lucide-react";

interface StreakTrackerProps {
  currentStreak: number;
  streakDates: Date[];
  isLoading?: boolean;
}

export default function StreakTracker({ 
  currentStreak, 
  streakDates, 
  isLoading = false 
}: StreakTrackerProps) {
  // Get the last 7 days with streaks
  const getLastSevenDays = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const hasEntry = streakDates.some(streakDate => 
        isSameDay(new Date(streakDate), date)
      );
      
      days.push({
        date,
        hasEntry,
        label: format(date, 'EEE').slice(0, 3), // Mon, Tue, etc.
      });
    }
    
    return days;
  };
  
  if (isLoading) {
    return (
      <div className="mb-8 p-6 bg-clay-100 rounded-xl animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-6 bg-clay-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-clay-200 rounded w-48"></div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <div className="h-8 bg-clay-200 rounded w-12"></div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between items-center">
            {Array(7).fill(0).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-clay-200 mb-2"></div>
                <div className="h-3 bg-clay-200 rounded w-5"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  const days = getLastSevenDays();
  
  return (
    <div className="mb-8 p-6 bg-clay-100 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-xl font-medium text-clay-800">Current Streak</h3>
          <p className="text-clay-600 mt-1">
            {currentStreak > 0 
              ? "You're on a roll! Keep it up." 
              : "Start your streak by writing today!"}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center">
          <span className="text-3xl font-serif font-semibold text-clay-800">{currentStreak}</span>
          <span className="ml-2 text-clay-600">days</span>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center">
          {days.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`streak-dot w-5 h-5 rounded-full ${
                  day.hasEntry ? 'bg-sage-400' : 'bg-clay-300'
                } mb-2`}
                title={format(day.date, 'MMMM d, yyyy')}
              ></div>
              <span className="text-xs text-clay-600">{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
