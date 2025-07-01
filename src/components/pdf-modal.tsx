"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDFViewer } from "./pdf-viewer";
import { useRef } from "react";

export const PdfModal = ({ 
  open, 
  onOpenChange, 
  pdfUrl,
  pageNumber
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  pdfUrl: string | null;
  pageNumber?: number;
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={dialogRef}
        className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden"
        onInteractOutside={(e) => {
          // Prevent closing when interacting with the PDF viewer controls
          if (dialogRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Document Viewer</DialogTitle>
        </DialogHeader>
        <div className="h-full">
          {pdfUrl ? (
            <PDFViewer file={pdfUrl} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No document selected</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};