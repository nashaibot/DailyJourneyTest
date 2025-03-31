import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import CalendarView from "@/components/journal/calendar-view";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

// Import or define the CalendarDay type to match what's used in CalendarView
interface CalendarDay {
  date: string;
  entryId?: number;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [_, navigate] = useLocation();
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Get calendar data for the current month
  const { data: calendarData, isLoading } = useQuery<CalendarDay[]>({
    queryKey: ["/api/calendar", currentYear, currentMonth],
  });
  
  const navigateToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };
  
  const navigateToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };
  
  const monthYearDisplay = format(currentDate, 'MMMM yyyy');

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-clay-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="sm:hidden bg-clay-300 px-4 py-3 flex justify-between items-center">
          <h1 className="font-serif text-xl font-medium text-clay-800">clay journal</h1>
          <button className="p-2 rounded-lg bg-clay-200 text-clay-700">
            <span className="sr-only">Open menu</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </header>
        
        {/* Main content */}
        <div className="flex-1 px-4 sm:px-8 py-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-clay-800">Calendar View</h2>
              <p className="text-clay-600 mt-1">Track your journal entries over time</p>
            </div>
            
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                onClick={navigateToPreviousMonth}
                className="text-clay-700 hover:bg-clay-200"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Previous month</span>
              </Button>
              
              <h3 className="font-serif text-xl font-medium text-clay-800">{monthYearDisplay}</h3>
              
              <Button 
                variant="ghost" 
                onClick={navigateToNextMonth}
                className="text-clay-700 hover:bg-clay-200"
              >
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Next month</span>
              </Button>
            </div>
            
            {/* Calendar grid */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <CalendarView 
                calendarData={calendarData || []} 
                year={currentYear}
                month={currentMonth}
                isLoading={isLoading}
                onDayClick={(entryId) => {
                  if (entryId) {
                    navigate(`/entry/${entryId}`);
                  }
                }}
                showEmptyDays={true}
              />
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-sage-400 mr-2"></div>
                <span className="text-sm text-clay-600">Entry present</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-clay-200 mr-2"></div>
                <span className="text-sm text-clay-600">No entry</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-clay-800 mr-2"></div>
                <span className="text-sm text-clay-600">Today</span>
              </div>
            </div>
          </div>
        </div>
        
        <MobileNav />
      </main>
    </div>
  );
}
