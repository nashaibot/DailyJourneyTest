import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tag } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Save, ArrowLeft, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

export default function NewEntryPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [showTagDialog, setShowTagDialog] = useState(false);
  
  // Get tags
  const { data: tags, refetch: refetchTags } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });
  
  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: { 
      userId: number;
      title: string;
      content: string;
      mood?: string;
      isPublished: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/entries", entryData);
      return await res.json();
    },
    onSuccess: async (data) => {
      // Add tags to the entry
      if (selectedTags.length > 0) {
        for (const tagId of selectedTags) {
          await apiRequest("POST", `/api/entries/${data.id}/tags`, { tagId });
        }
      }
      
      // Reset form and navigate to the new entry
      toast({
        title: "Entry created",
        description: "Your journal entry has been saved",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      
      // Navigate to the new entry
      navigate(`/entry/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create entry",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      const res = await apiRequest("POST", "/api/tags", { name: tagName });
      return await res.json();
    },
    onSuccess: (newTag) => {
      toast({
        title: "Tag created",
        description: `Tag "${newTag.name}" has been created`,
      });
      setNewTagName("");
      setShowTagDialog(false);
      refetchTags();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      await apiRequest("DELETE", `/api/tags/${tagId}`);
    },
    onSuccess: () => {
      toast({
        title: "Tag deleted",
        description: "The tag has been removed",
      });
      refetchTags();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your entry",
        variant: "destructive",
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry",
        variant: "destructive",
      });
      return;
    }
    
    createEntryMutation.mutate({
      userId: user?.id || 1, // Fallback for demo without auth
      title: title.trim(),
      content: content.trim(),
      mood: selectedMood || undefined,
      isPublished: true
    });
  };
  
  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: "Tag name required",
        description: "Please provide a name for the tag",
        variant: "destructive",
      });
      return;
    }

    createTagMutation.mutate(newTagName.trim());
  };
  
  const handleDeleteTag = (tagId: number) => {
    // Remove from selected tags if it's selected
    setSelectedTags(prev => prev.filter(id => id !== tagId));
    
    // Delete the tag
    deleteTagMutation.mutate(tagId);
  };
  
  // List of mood descriptors to choose from
  const moods = [
    "happy", "excited", "content", "relaxed", "grateful",
    "anxious", "stressed", "sad", "depressed", "angry",
    "frustrated", "tired", "bored", "calm", "hopeful"
  ];
  
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
              
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={createEntryMutation.isPending}
                className="bg-clay-300 hover:bg-clay-400 text-clay-800"
              >
                <Save className="mr-2 h-4 w-4" />
                {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
            
            {/* Journal Page */}
            <div className="bg-white border border-clay-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-8 bg-clay-100 border-b border-clay-200">
                {/* Entry title */}
                <div className="mb-4">
                  <label htmlFor="entry-title" className="block text-sm font-medium text-clay-700 mb-2">
                    Entry Title
                  </label>
                  <Input
                    id="entry-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your entry a title..."
                    className="text-2xl font-serif font-medium bg-white border-clay-200"
                  />
                </div>
                
                {/* Entry metadata */}
                <div className="flex flex-wrap gap-6">
                  {/* Mood */}
                  <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-clay-700 mb-2">
                      Mood
                    </label>
                    <div className="flex flex-wrap gap-2 max-w-xl">
                      {moods.map(mood => (
                        <Button
                          key={mood}
                          type="button"
                          variant={selectedMood === mood ? "default" : "outline"}
                          onClick={() => setSelectedMood(mood)}
                          className={selectedMood === mood 
                            ? "bg-clay-300 hover:bg-clay-400 text-clay-800 border-clay-300" 
                            : "border-clay-300 text-clay-700"
                          }
                          size="sm"
                        >
                          <span className="capitalize">{mood}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-clay-700">
                        Tags
                      </label>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setShowTagDialog(true)}
                        className="text-clay-700 hover:bg-clay-200"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add New Tag
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags?.map(tag => (
                        <TooltipProvider key={tag.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                                onClick={() => toggleTag(tag.id)}
                                className={selectedTags.includes(tag.id) 
                                  ? "bg-clay-300 hover:bg-clay-400 text-clay-800 border-clay-300" 
                                  : "border-clay-300 text-clay-700"
                                }
                                size="sm"
                              >
                                {tag.name}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <div className="flex items-center gap-2">
                                <span>Toggle tag</span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-clay-500 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent tag toggle
                                    handleDeleteTag(tag.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8 bg-[#fffdf8] min-h-[50vh]">
                <label htmlFor="entry-content" className="block text-sm font-medium text-clay-700 mb-2">
                  Today's thoughts
                </label>
                <Textarea
                  id="entry-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind today? Write freely and reflect on your experiences, thoughts, and feelings..."
                  className="min-h-[400px] bg-[#fffdf8] border-clay-200 p-4 text-clay-800 text-lg leading-relaxed font-serif"
                  rows={15}
                />
                
                <div className="mt-4 text-clay-500 text-sm italic">
                  Writing consistently helps build valuable self-reflection habits and creates a meaningful record of your journey.
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-clay-100 border-t border-clay-200 text-clay-500 text-sm text-center italic">
                Clay Journal • Your words, your journey
              </div>
            </div>
          </div>
        </div>
        
        <MobileNav />
      </main>

      {/* Create New Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-md bg-clay-50 border-clay-200">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-clay-800">Create New Tag</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div>
              <label htmlFor="tag-name" className="block text-sm font-medium text-clay-700 mb-1">
                Tag Name
              </label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter a tag name..."
                className="bg-white border-clay-200"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowTagDialog(false)}
              className="border-clay-300 text-clay-700"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateTag}
              disabled={createTagMutation.isPending}
              className="bg-clay-300 hover:bg-clay-400 text-clay-800"
            >
              {createTagMutation.isPending ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}