import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileIcon, Image, FileText, File } from 'lucide-react';
import { uploadChatFile, formatFileSize, ChatFileDto } from '@/api/chatFileApi';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

interface FileUploadButtonProps {
  onFileUploaded: (fileData: ChatFileDto) => void;
  disabled?: boolean;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onFileUploaded, disabled }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const fileData = await uploadChatFile(selectedFile);
      onFileUploaded(fileData);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "File uploaded",
        description: `${selectedFile.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (fileType.includes('document') || fileType.includes('text')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
        disabled={disabled || isUploading}
      />
      
      {!selectedFile ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="h-9 w-9"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      ) : (
        <Card className="absolute bottom-12 left-0 p-3 bg-gray-800 border-gray-700 min-w-[300px] z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getFileIcon(selectedFile.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
                className="h-7 px-3"
              >
                {isUploading ? 'Uploading...' : 'Send'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={isUploading}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
