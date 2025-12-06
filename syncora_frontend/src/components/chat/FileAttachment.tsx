import React, { useState, useEffect } from 'react';
import { Download, FileIcon, Image, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatFileSize, downloadChatFile } from '@/api/chatFileApi';

interface FileAttachmentProps {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  fileId,
  fileName,
  fileSize,
  fileType,
  downloadUrl,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isImage = fileType.startsWith('image/');

  useEffect(() => {
    if (isImage) {
      // Load image with authentication
      downloadChatFile(fileId)
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          setImageUrl(url);
        })
        .catch(error => console.error('Error loading image:', error));
    }

    return () => {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, [fileId, isImage]);

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (fileType.includes('document') || fileType.includes('text')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const blob = await downloadChatFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="p-3 bg-gray-700/50 border-gray-600 max-w-sm">
      {isImage ? (
        <div className="space-y-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={fileName}
              className="rounded-lg max-w-full h-auto max-h-64 object-contain cursor-pointer"
              onClick={handleDownload}
            />
          ) : (
            <div className="rounded-lg bg-gray-600 h-32 flex items-center justify-center">
              <span className="text-gray-400">Loading...</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getFileIcon()}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {fileName}
                </div>
                <div className="text-xs text-gray-400">
                  {formatFileSize(fileSize)}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 w-8 flex-shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getFileIcon()}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">
                {fileName}
              </div>
              <div className="text-xs text-gray-400">
                {formatFileSize(fileSize)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-8 w-8 flex-shrink-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};
