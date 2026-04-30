import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";

interface RequestMediaViewerProps {
  url?: string;
  altText: string;
}

const BUCKET = "buy-request-screenshots";

/**
 * Extract the storage object path from a Supabase storage URL.
 * Handles both /object/public/<bucket>/<path> and /object/sign/<bucket>/<path> formats.
 * Returns null if the URL doesn't reference our bucket.
 */
const extractStoragePath = (url: string): string | null => {
  try {
    const u = new URL(url);
    const marker = `/storage/v1/object/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    // remainder example: "public/buy-request-screenshots/<path>" or "sign/buy-request-screenshots/<path>"
    const remainder = u.pathname.slice(idx + marker.length);
    const parts = remainder.split("/");
    // parts[0] = 'public' | 'sign' | 'authenticated', parts[1] = bucket
    if (parts.length < 3) return null;
    if (parts[1] !== BUCKET) return null;
    return parts.slice(2).join("/");
  } catch {
    return null;
  }
};

export const RequestMediaViewer = ({ url, altText }: RequestMediaViewerProps) => {
  const [imageError, setImageError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(url);

  useEffect(() => {
    setImageError(false);
    setResolvedUrl(url);
    if (!url) return;

    const path = extractStoragePath(url);
    if (!path) return; // external URL — use as-is

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60); // 1 hour
      if (!cancelled && !error && data?.signedUrl) {
        setResolvedUrl(data.signedUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return null;

  const displayUrl = resolvedUrl || url;

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="relative w-full">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {imageError ? (
            <div className="flex items-center justify-center h-full">
              <a
                href={displayUrl}
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
              src={displayUrl}
              alt={altText}
              className="object-contain w-full h-full"
              onError={() => setImageError(true)}
            />
          )}
        </AspectRatio>
      </div>
      <div className="p-2 text-center">
        <a
          href={displayUrl}
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
