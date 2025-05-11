
import { ExternalLink, Image } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface RequestMediaViewerProps {
  url?: string;
  altText: string;
}

export const RequestMediaViewer = ({ url, altText }: RequestMediaViewerProps) => {
  if (!url) return null;
  
  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="relative w-full">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <img
            src={url}
            alt={altText}
            className="object-contain w-full h-full"
            onError={(e) => {
              // If image fails to load, show as a link instead
              const target = e.target as HTMLImageElement;
              const container = target.parentNode?.parentNode as HTMLDivElement;
              if (container) {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'text-blue-500 hover:underline flex items-center justify-center h-full';
                link.innerHTML = `
                  <span class="flex items-center">
                    View File
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </span>
                `;
                container.innerHTML = '';
                container.appendChild(link);
              }
            }}
          />
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
