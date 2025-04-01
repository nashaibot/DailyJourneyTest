import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import EntryCard from "@/components/journal/entry-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryWithTags } from "@shared/schema";
import { Plus, Search } from "lucide-react";

export default function JournalPage() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get all entries
  const { data: entries, isLoading } = useQuery<EntryWithTags[]>({
    queryKey: ["/api/entries"],
  });
  
  // Filter entries based on search query
  const filteredEntries = entries?.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-clay-800">Journal Entries</h2>
                  <p className="text-clay-600 mt-1">Browse and search your writing journey</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button 
                    onClick={() => navigate("/entry/new")}
                    className="inline-flex items-center px-4 py-2 rounded-full bg-clay-300 hover:bg-clay-400 text-clay-800 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>New Entry</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Search bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-clay-500 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-clay-200 focus:border-clay-300 focus:ring-clay-300"
                />
              </div>
            </div>
            
            {/* Entries list */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-5 bg-white rounded-xl shadow-sm animate-pulse">
                    <div className="h-6 bg-clay-100 rounded mb-3 w-2/3"></div>
                    <div className="h-4 bg-clay-100 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-clay-100 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-clay-100 rounded mb-2 w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredEntries && filteredEntries.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : entries && entries.length > 0 ? (
              <div className="text-center p-8 bg-white rounded-xl shadow-sm">
                <p className="text-clay-600">No entries match your search. Try a different query.</p>
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-xl shadow-sm">
                <p className="text-clay-600 mb-4">No journal entries yet. Start writing today!</p>
                <Button 
                  onClick={() => navigate("/entry/new")}
                  className="bg-clay-300 hover:bg-clay-400 text-clay-800"
                >
                  Create your first entry
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <MobileNav />
      </main>
    </div>
  );
}
