import { Link } from "wouter";
import { EntryWithTags } from "@shared/schema";
import { format } from "date-fns";

interface EntryCardProps {
  entry: EntryWithTags;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const formattedDate = format(new Date(entry.createdAt), 'MMM d');
  
  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };
  
  // Extract first few tags to display
  const displayTags = entry.tags?.slice(0, 3) || [];
  
  // Get mood emoji
  const getMoodEmoji = (mood?: string) => {
    if (!mood) return null;
    
    const moodMap: Record<string, string> = {
      happy: "😊",
      neutral: "😐",
      sad: "😔",
      angry: "😡",
      tired: "😴"
    };
    
    return moodMap[mood] || null;
  };
  
  return (
    <Link href={`/entry/${entry.id}`}>
      <a className="entry-card block bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-clay-200 overflow-hidden">
        <div className="p-5 border-b border-clay-100">
          <div className="mb-2 flex justify-between items-start">
            <h4 className="font-serif text-lg font-medium text-clay-800">{entry.title}</h4>
            <div className="flex items-center">
              {entry.mood && getMoodEmoji(entry.mood) && (
                <span className="mr-2 text-lg" title={entry.mood}>
                  {getMoodEmoji(entry.mood)}
                </span>
              )}
              <span className="text-sm text-clay-500 bg-clay-50 px-2 py-1 rounded-md">
                {formattedDate}
              </span>
            </div>
          </div>
          <p className="text-clay-600 line-clamp-3 font-serif">
            {truncateContent(entry.content)}
          </p>
        </div>
        
        {displayTags.length > 0 && (
          <div className="px-5 py-3 bg-clay-50 flex items-center gap-2 flex-wrap">
            {displayTags.map(tag => (
              <span 
                key={tag.id} 
                className="text-xs px-2 py-1 bg-clay-200 text-clay-700 rounded-full"
              >
                {tag.name}
              </span>
            ))}
            
            {entry.tags && entry.tags.length > 3 && (
              <span className="text-xs text-clay-600">
                +{entry.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </a>
    </Link>
  );
}
