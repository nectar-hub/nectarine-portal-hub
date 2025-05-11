
import { ExternalLink } from "lucide-react";

interface ProductLinkProps {
  url: string;
}

export const ProductLink = ({ url }: ProductLinkProps) => {
  return (
    <p className="break-all">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline flex items-center"
      >
        {url}
        <ExternalLink className="h-4 w-4 ml-1 inline" />
      </a>
    </p>
  );
};
