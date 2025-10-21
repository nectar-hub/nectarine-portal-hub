
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface RequestMediaViewerProps {
  url?: string;
  altText: string;
}

export const RequestMediaViewer = ({ url, altText }: RequestMediaViewerProps) => {
  const [imageError, setImageError] = useState(false);
  
  if (!url) return null;
  
  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="relative w-full">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {imageError ? (
            <div className="flex items-center justify-center h-full">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center"
              >
                View File
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt={altText}
              className="object-contain w-full h-full"
              onError={() => setImageError(true)}
            />
          )}
        </AspectRatio>
      </div>
      <div className="p-2 text-center">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-sm flex items-center justify-center"
        >
          Open in new tab
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
    </div>
  );
};
