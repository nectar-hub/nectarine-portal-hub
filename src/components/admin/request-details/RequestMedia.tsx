
import { Image } from "lucide-react";
import { RequestMediaViewer } from "./RequestMediaViewer";

interface RequestMediaProps {
  requestType: 'buy_request' | 'self_purchase';
  screenshotUrl?: string;
  invoiceUrl?: string;
}

export const RequestMedia = ({ requestType, screenshotUrl, invoiceUrl }: RequestMediaProps) => {
  const mediaUrl = screenshotUrl || invoiceUrl;
  if (!mediaUrl) return null;
  
  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-medium flex items-center mb-2">
        <Image className="h-4 w-4 mr-2 text-gray-500" />
        {requestType === 'buy_request' ? 'Screenshot' : 'Invoice'}
      </h4>
      <RequestMediaViewer 
        url={mediaUrl}
        altText={requestType === 'buy_request' ? 'Uploaded screenshot' : 'Uploaded invoice'}
      />
    </div>
  );
};
