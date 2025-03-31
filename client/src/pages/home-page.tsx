import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import NewEntryDialog from "@/components/journal/new-entry-dialog";
import StreakTracker from "@/components/journal/streak-tracker";
import CalendarView from "@/components/journal/calendar-view";
import EntryCard from "@/components/journal/entry-card";
import { Button } from "@/components/ui/button";
import { Entry } from "@shared/schema";
import { ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";

export default function HomePage() {
  const { user } = useAuth();
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  
  // Get entries
  const { data: entries, isLoading: entriesLoading } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });
  
  // Get streak data
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ["/api/streak"],
  });
  
  // Get current month/year for calendar
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Get calendar data
  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ["/api/calendar", currentYear, currentMonth],
  });
  
  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  // Get current month name
  const currentMonthName = format(new Date(), 'MMMM yyyy');

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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-clay-800">
                    {getGreeting()}, {user?.displayName?.split(' ')[0]}
                  </h2>
                  <p className="text-clay-600 mt-1">It's time to reflect on your day</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button 
                    onClick={() => setShowNewEntryDialog(true)}
                    className="inline-flex items-center px-4 py-2 rounded-full bg-clay-300 hover:bg-clay-400 text-clay-800 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>New Entry</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Streak Section */}
            <StreakTracker 
              currentStreak={streakData?.currentStreak || 0} 
              streakDates={streakData?.streakDates || []} 
              isLoading={streakLoading}
            />
            
            {/* Month at a Glance */}
            <div className="mb-8">
              <h3 className="font-serif text-xl font-medium text-clay-800 mb-4">{currentMonthName}</h3>
              <CalendarView 
                calendarData={calendarData || []} 
                year={currentYear}
                month={currentMonth}
                isLoading={calendarLoading}
              />
            </div>
            
            {/* Recent Entries */}
            <div className="mb-8">
              <h3 className="font-serif text-xl font-medium text-clay-800 mb-4">Recent Entries</h3>
              
              {entriesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-5 bg-white rounded-xl shadow-sm animate-pulse">
                      <div className="h-6 bg-clay-100 rounded mb-3 w-2/3"></div>
                      <div className="h-4 bg-clay-100 rounded mb-2 w-full"></div>
                      <div className="h-4 bg-clay-100 rounded mb-2 w-full"></div>
                      <div className="h-4 bg-clay-100 rounded mb-2 w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : entries && entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entries.slice(0, 4).map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm">
                  <p className="text-clay-600 mb-4">No journal entries yet. Start writing today!</p>
                  <Button 
                    onClick={() => setShowNewEntryDialog(true)}
                    className="bg-clay-300 hover:bg-clay-400 text-clay-800"
                  >
                    Create your first entry
                  </Button>
                </div>
              )}
              
              {entries && entries.length > 4 && (
                <div className="mt-6 text-center">
                  <Link href="/journal">
                    <Button variant="ghost" className="inline-flex items-center px-4 py-2 rounded-full text-clay-700 hover:bg-clay-200">
                      <span>View all entries</span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <MobileNav />
      </main>
      
      <NewEntryDialog 
        open={showNewEntryDialog} 
        onOpenChange={setShowNewEntryDialog} 
      />
    </div>
  );
}
