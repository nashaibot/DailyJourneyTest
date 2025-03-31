import { Link, useLocation } from "wouter";
import { BookOpen, Calendar, LineChart, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  
  const navigationItems = [
    { path: "/journal", label: "Journal", icon: BookOpen },
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/stats", label: "Stats", icon: LineChart },
    { path: "/profile", label: "Profile", icon: User },
  ];
  
  return (
    <nav className="sm:hidden bg-clay-300 px-4 py-3">
      <ul className="flex justify-between">
        {navigationItems.map(item => (
          <li key={item.path}>
            <Link href={item.path}>
              <a 
                className={`flex flex-col items-center ${
                  location === item.path ? "text-clay-800" : "text-clay-600"
                }`}
              >
                <item.icon className="text-lg h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
