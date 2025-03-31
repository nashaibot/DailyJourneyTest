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
  
  return (
    <Link href={`/entry/${entry.id}`}>
      <a className="entry-card block p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
        <div className="mb-3 flex justify-between items-start">
          <h4 className="font-serif font-medium text-clay-800">{entry.title}</h4>
          <span className="text-sm text-clay-500">{formattedDate}</span>
        </div>
        <p className="text-clay-600 line-clamp-3">
          {truncateContent(entry.content)}
        </p>
        
        {displayTags.length > 0 && (
          <div className="mt-4 flex items-center space-x-2 flex-wrap">
            {displayTags.map(tag => (
              <span 
                key={tag.id} 
                className="text-xs px-2 py-1 bg-clay-100 text-clay-600 rounded-full"
              >
                {tag.name}
              </span>
            ))}
            
            {entry.tags && entry.tags.length > 3 && (
              <span className="text-xs text-clay-500">
                +{entry.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </a>
    </Link>
  );
}
