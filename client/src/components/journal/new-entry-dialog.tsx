import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { X, Save } from "lucide-react";
import { Tag } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewEntryDialog({ open, onOpenChange }: NewEntryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Get tags
  const { data: tags } = useQuery<Tag[]>({
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
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      
      toast({
        title: "Entry created",
        description: "Your journal entry has been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create entry",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedTags([]);
    setSelectedMood(null);
  };
  
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
      userId: user!.id,
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
  
  const moods = [
    { emoji: "😊", name: "happy" },
    { emoji: "😐", name: "neutral" },
    { emoji: "😔", name: "sad" },
    { emoji: "😡", name: "angry" },
    { emoji: "😴", name: "tired" }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-clay-50 border-clay-200">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-clay-800">New Journal Entry</DialogTitle>
        </DialogHeader>
        
        {/* Journal Page Preview */}
        <div className="bg-white border border-clay-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 bg-clay-100 border-b border-clay-200">
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="entry-title" className="block text-sm font-medium text-clay-700 mb-2">
                Entry Title
              </label>
              <Input
                id="entry-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your entry a title..."
                className="bg-white border-clay-200 text-xl font-serif"
              />
            </div>
            
            {/* Metadata */}
            <div className="flex flex-wrap gap-4">
              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-clay-700 mb-2">
                  Mood
                </label>
                <div className="flex gap-2">
                  {moods.map(mood => (
                    <TooltipProvider key={mood.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant={selectedMood === mood.name ? "default" : "outline"}
                            onClick={() => setSelectedMood(mood.name)}
                            className={`p-2 text-xl ${selectedMood === mood.name 
                              ? "bg-clay-300 hover:bg-clay-400 text-clay-800 border-clay-300" 
                              : "border-clay-300 text-clay-700"
                            }`}
                            size="icon"
                          >
                            {mood.emoji}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{mood.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-clay-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags?.map(tag => (
                    <Button
                      key={tag.id}
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
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 bg-[#fffdf8]">
            <label htmlFor="entry-content" className="block text-sm font-medium text-clay-700 mb-2">
              Today's thoughts
            </label>
            <Textarea
              id="entry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind today? Write freely and reflect on your experiences, thoughts, and feelings..."
              className="min-h-[300px] bg-[#fffdf8] border-clay-200 p-4 text-clay-800 text-lg leading-relaxed font-serif"
              rows={10}
            />
            
            <div className="mt-4 text-clay-500 text-sm italic">
              Writing consistently helps build valuable self-reflection habits and creates a meaningful record of your journey.
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 bg-clay-100 border-t border-clay-200 flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-clay-300 text-clay-700"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
