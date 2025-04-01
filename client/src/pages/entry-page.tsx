import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, ArrowLeft, Trash } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { EntryWithTags, InsertEntry } from "@shared/schema";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EntryPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const entryId = parseInt(params.id);

  // Get entry data
  const { data: entry, isLoading, error } = useQuery<EntryWithTags>({
    queryKey: [`/api/entries/${entryId}`],
    onSuccess: (data: EntryWithTags) => {
      setTitle(data.title);
      setContent(data.content);
    }
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedEntry: Partial<InsertEntry>) => {
      const res = await apiRequest("PUT", `/api/entries/${entryId}`, updatedEntry);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/entries/${entryId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      setIsEditing(false);
      toast({
        title: "Entry updated",
        description: "Your journal entry has been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      navigate("/journal");
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your entry",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      userId: user!.id,
      title,
      content,
      mood: entry?.mood,
      isPublished: entry?.isPublished
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col sm:flex-row bg-clay-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-clay-500" />
        </main>
        <MobileNav />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex flex-col sm:flex-row bg-clay-50">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-clay-800 mb-4">Entry not found</h2>
            <p className="text-clay-600 mb-6">The journal entry you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => navigate("/journal")} className="bg-clay-300 hover:bg-clay-400 text-clay-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Journal
            </Button>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

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
        
        {/* Entry content */}
        <div className="flex-1 px-4 sm:px-8 py-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Entry header */}
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate("/journal")}
                className="text-clay-700 hover:bg-clay-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Journal
              </Button>
              
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-clay-300 hover:bg-clay-400 text-clay-800"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-clay-300 hover:bg-clay-400 text-clay-800"
                  >
                    Edit
                  </Button>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-clay-50 border-clay-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-clay-800">Delete entry?</AlertDialogTitle>
                      <AlertDialogDescription className="text-clay-600">
                        This action cannot be undone. This will permanently delete your journal entry.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-clay-200 text-clay-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            {/* Journal Page */}
            <div className="bg-white border border-clay-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-8 bg-clay-100 border-b border-clay-200">
                {/* Entry title */}
                {isEditing ? (
                  <div className="mb-4">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Entry title"
                      className="text-2xl font-serif font-medium bg-white border-clay-200"
                    />
                  </div>
                ) : (
                  <h1 className="font-serif text-2xl sm:text-3xl font-medium text-clay-800 mb-4">
                    {entry.title}
                  </h1>
                )}
                
                {/* Entry metadata */}
                <div className="flex flex-wrap items-center text-clay-600 text-sm">
                  <span className="font-medium">{format(new Date(entry.createdAt), 'MMMM d, yyyy')}</span>
                  
                  {entry.mood && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <span className="mr-1">Mood:</span>
                        <span className="capitalize">
                          {entry.mood === "happy" && "😊 Happy"}
                          {entry.mood === "neutral" && "😐 Neutral"}
                          {entry.mood === "sad" && "😔 Sad"}
                          {entry.mood === "angry" && "😡 Angry"}
                          {entry.mood === "tired" && "😴 Tired"}
                        </span>
                      </span>
                    </>
                  )}
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <span 
                            key={tag.id} 
                            className="px-2 py-1 bg-clay-200 text-clay-700 rounded-full text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Entry content */}
              <div className="p-8 bg-[#fffdf8] min-h-[50vh]">
                {isEditing ? (
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts here..."
                    className="min-h-[400px] bg-[#fffdf8] border-clay-200 p-4 text-clay-800 text-lg leading-relaxed font-serif"
                  />
                ) : (
                  <div className="prose prose-clay max-w-none font-serif">
                    {content.split('\n').map((paragraph, index) => (
                      paragraph ? (
                        <p key={index} className="mb-6 text-clay-800 leading-relaxed text-lg">
                          {paragraph}
                        </p>
                      ) : <br key={index} />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Journal footer */}
              <div className="p-4 bg-clay-100 border-t border-clay-200 text-clay-500 text-sm text-center italic">
                Clay Journal • Your words, your journey
              </div>
            </div>
          </div>
        </div>
        
        <MobileNav />
      </main>
    </div>
  );
}
