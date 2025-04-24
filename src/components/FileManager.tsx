"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Trash2, ChevronRight, ChevronDown, AlertCircle, Download } from "lucide-react";
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
  original_id: string; // Added to match backend response structure
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

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      // Use the original_id from the backend for deletion
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
        // Update local state to remove the file
        setFiles((prev) => prev.filter((file) => file.id !== fileToDelete.id));
        
        // Call the parent's onDeleteFile if provided
        if (onDeleteFile) {
          await onDeleteFile(fileToDelete.id);
        }
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
    try {
      const response = await fetch(`${BACKEND_URL}/files/${fileId}/download`);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary link element to trigger the download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL object
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("File download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`);
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

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Paperclip className="h-4 w-4" />
            Manage Files
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Files in Current Session</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">No files in this session</p>
              <p className="text-sm text-muted-foreground">Upload files to get started</p>
            </div>
          ) : (
            <ScrollArea className="max-h-60vh">
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.size ? formatFileSize(file.size) : "PDF/CSV"} • 
                            {file.created_at ? formatDate(file.created_at) : "Recently added"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {file.size && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => downloadFile(file.id, file.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFile} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}