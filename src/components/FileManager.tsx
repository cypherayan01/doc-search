"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Trash2, AlertCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BACKEND_URL = "http://localhost:8000";

export interface FileInfo {
  id: string;
  name: string;
  type: string;
  original_id: string;
  session_id?: string;
  created_at?: string;
  size?: number;
}

export default function FileManager({ sessionId, onDeleteFile }: { 
  sessionId: string, 
  onDeleteFile?: (fileId: string) => Promise<boolean>
}) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/files?session_id=${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
      }
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error(
        `Failed to fetch files: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (file: FileInfo) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  // const confirmDeleteFile = async () => {
  //   if (!fileToDelete) return;

  //   try {
  //     const fileId = fileToDelete.original_id;
  //     const response = await fetch(`${BACKEND_URL}/files/${fileId}`, {
  //       method: 'DELETE',
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Failed to delete file: ${response.status}`);
  //     }

  //     const result = await response.json();
      
  //     if (result.success) {
  //       toast.success(`File "${fileToDelete.name}" deleted successfully`);
  //       setFiles((prev) => prev.filter((file) => file.id !== fileToDelete.id));
        
  //       if (onDeleteFile) {
  //         await onDeleteFile(fileToDelete.id);
  //       }
  //     } else {
  //       throw new Error(result.error || "Unknown error");
  //     }
  //   } catch (error) {
  //     console.error("Error deleting file:", error);
  //     toast.error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
  //   } finally {
  //     setDeleteDialogOpen(false);
  //     setFileToDelete(null);
  //   }
  // };
  const confirmDeleteFile = async () => {
  if (!fileToDelete) return;

  try {
    const fileId = fileToDelete.original_id;
    const response = await fetch(`${BACKEND_URL}/files/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      toast.success(`File "${fileToDelete.name}" deleted successfully`);
      setFiles((prev) => prev.filter((file) => file.id !== fileToDelete.id));
      
      if (onDeleteFile) {
        await onDeleteFile(fileToDelete.id);
      }
      
      // Refresh the file list instead of reloading the page
      await fetchFiles();
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    toast.error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  }
};


  const downloadFile = async (fileId: string, fileName: string) => {
    setIsDownloading(fileId);
    try {
      const response = await fetch(`${BACKEND_URL}/files/${fileId}/download`);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("File download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsDownloading(null);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [sessionId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIconColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'text-red-500';
    if (fileType.includes('csv') || fileType.includes('excel')) return 'text-green-500';
    if (fileType.includes('word')) return 'text-blue-500';
    if (fileType.includes('text')) return 'text-gray-500';
    return 'text-indigo-500';
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50"
          >
            <Paperclip className="h-4 w-4 text-indigo-600" />
            Manage Files
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md md:max-w-lg rounded-xl border-indigo-100 bg-gradient-to-b from-white to-indigo-100">
          <DialogHeader>
            <DialogTitle className="text-indigo-900">Files in Current Session</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-indigo-700">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100/50">
                <AlertCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="mt-4 text-lg font-semibold text-indigo-900">No files in this session</p>
              <p className="text-sm text-indigo-700/70">Upload files to get started</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-3">
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className="border border-indigo-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/30 hover:from-indigo-100/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-md ${getFileIconColor(file.type)} bg-indigo-50`}>
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-indigo-900 truncate">{file.name}</div>
                          <div className="text-xs text-indigo-700/70 truncate">
                            {formatFileSize(file.size)} • {formatDate(file.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                          onClick={() => downloadFile(file.id, file.name)}
                          disabled={!!isDownloading}
                        >
                          {isDownloading === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 border-red-200"
                          onClick={() => handleDeleteFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-indigo-100 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-indigo-900">Delete File</AlertDialogTitle>
            <AlertDialogDescription className="text-indigo-700/80">
              Are you sure you want to delete <span className="font-medium">"{fileToDelete?.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteFile} 
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}