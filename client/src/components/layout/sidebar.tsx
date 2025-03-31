import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  BookOpen,
  Calendar,
  LineChart,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const navigationItems = [
    { path: "/journal", label: "Journal", icon: BookOpen },
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/stats", label: "Stats", icon: LineChart },
  ];
  
  return (
    <aside className="hidden sm:flex flex-col w-64 bg-clay-300 py-8 px-4 justify-between">
      <div>
        <div className="flex items-center mb-8 px-4">
          <Link href="/">
            <h1 className="font-serif text-2xl font-medium text-clay-800 cursor-pointer">clay journal</h1>
          </Link>
        </div>
        
        <nav>
          <ul className="space-y-2">
            {navigationItems.map(item => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a 
                    className={`flex items-center px-4 py-3 rounded-lg ${
                      location === item.path 
                        ? "bg-clay-200 text-clay-800 font-medium" 
                        : "text-clay-700 hover:bg-clay-200 transition-all"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
            {/* Settings link disabled for now */}
            <li>
              <a 
                className="flex items-center px-4 py-3 rounded-lg text-clay-700 hover:bg-clay-200 transition-all cursor-not-allowed opacity-60"
              >
                <Settings className="mr-3 h-5 w-5" />
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="mt-4 px-4">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10 bg-clay-400 text-clay-50">
            <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-clay-800">{user?.displayName}</p>
            <p className="text-sm text-clay-600">{user?.email}</p>
          </div>
        </div>
        <Button 
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-clay-600 hover:bg-clay-200 transition-all"
          variant="ghost"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out"}</span>
        </Button>
      </div>
    </aside>
  );
}
