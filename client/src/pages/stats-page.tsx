import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Loader2 } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";

export default function StatsPage() {
  const { user } = useAuth();
  
  // Get entries for stats
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/entries"],
  });
  
  // Get streak data
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ["/api/streak"],
  });
  
  // Calculate monthly activity data
  const getMonthlyData = () => {
    if (!entries || entries.length === 0) return [];
    
    // Group entries by month
    const entriesByMonth = entries.reduce((acc: Record<string, number>, entry) => {
      const month = format(new Date(entry.createdAt), 'MMM');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(entriesByMonth).map(([month, count]) => ({
      month,
      count
    }));
  };
  
  // Calculate last 30 days activity
  const getDailyActivity = () => {
    if (!entries || entries.length === 0) return [];
    
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    
    // Get all days in the interval
    const dateRange = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: today
    });
    
    // Create a map of dates to count
    const entriesByDate: Record<string, number> = {};
    
    // Initialize all dates with 0
    dateRange.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      entriesByDate[dateKey] = 0;
    });
    
    // Count entries per date
    entries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= thirtyDaysAgo && entryDate <= today) {
        const dateKey = format(entryDate, 'yyyy-MM-dd');
        entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + 1;
      }
    });
    
    // Convert to array for chart
    return Object.entries(entriesByDate).map(([date, count]) => ({
      date: format(new Date(date), 'dd MMM'),
      count
    }));
  };
  
  // Calculate tag distribution
  const getTagDistribution = () => {
    if (!entries || entries.length === 0) return [];
    
    // Count entries by tag
    const tagCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.tags && entry.tags.length > 0) {
        entry.tags.forEach(tag => {
          tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        });
      } else {
        tagCounts['Untagged'] = (tagCounts['Untagged'] || 0) + 1;
      }
    });
    
    // Convert to array for chart
    return Object.entries(tagCounts).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Pie chart colors
  const COLORS = ['#a3b492', '#e4c28e', '#d1bdaa', '#9e8777', '#8a9e7b', '#d9ad77', '#b6a18c'];
  
  const isLoading = entriesLoading || streakLoading;
  
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
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-clay-800">Statistics</h2>
              <p className="text-clay-600 mt-1">Track your writing progress and habits</p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-clay-500" />
              </div>
            ) : (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Entries</CardTitle>
                      <CardDescription>All time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-serif font-medium text-clay-800">{entries?.length || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Current Streak</CardTitle>
                      <CardDescription>Consecutive days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-serif font-medium text-clay-800">{user?.currentStreak || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Longest Streak</CardTitle>
                      <CardDescription>Personal best</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-serif font-medium text-clay-800">{user?.longestStreak || 0}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Monthly activity */}
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Monthly Activity</CardTitle>
                      <CardDescription>Entries per month</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getMonthlyData()} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#f5f0e8', 
                              border: 'none',
                              borderRadius: '0.5rem'
                            }} 
                          />
                          <Bar dataKey="count" fill="#a3b492" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  {/* Last 30 days */}
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getDailyActivity()} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#f5f0e8', 
                              border: 'none',
                              borderRadius: '0.5rem'
                            }} 
                          />
                          <Bar dataKey="count" fill="#d1bdaa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  {/* Tag distribution */}
                  <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Topics Distribution</CardTitle>
                      <CardDescription>Categorization of your entries</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getTagDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {getTagDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#f5f0e8', 
                              border: 'none',
                              borderRadius: '0.5rem'
                            }} 
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
        
        <MobileNav />
      </main>
    </div>
  );
}
