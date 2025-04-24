"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Folder, FileText, Trash2, ChevronRight, ChevronDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const BACKEND_URL = "http://localhost:8000";

export interface SessionInfo {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
}

export interface FileInfo {
  id: string;
  name: string;
  type: string;
  session_id: string;
  created_at: string;
  size: number;
}

export default function SessionManager({ onSelectSession }: { onSelectSession: (sessionId: string) => void }) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionFiles, setSessionFiles] = useState<Record<string, FileInfo[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/sessions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
  
      // Transform the sessions object into an array
      const sessionsArray = Object.keys(data.sessions).map((sessionId) => ({
        id: sessionId,
        ...data.sessions[sessionId], // Spread the session details
      }));
  
      setSessions(sessionsArray);
  
      // Initialize expanded state for each session
      const expanded: Record<string, boolean> = {};
      sessionsArray.forEach((session) => {
        expanded[session.id] = false;
      });
      setExpandedSessions(expanded);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error(
        `Failed to fetch sessions: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionFiles = async (sessionId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/files?session_id=${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
      }
      const data = await response.json();
      setSessionFiles((prev) => ({
        ...prev,
        [sessionId]: data.files || [],
      }));
    } catch (error) {
      console.error(`Error fetching files for session ${sessionId}:`, error);
      toast.error(`Failed to fetch files: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const deleteFile = async (fileId: string, sessionId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`);
      }

      setSessionFiles((prev) => ({
        ...prev,
        [sessionId]: (prev[sessionId] || []).filter((file) => file.id !== fileId),
      }));

      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session and all its files?")) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`);
      }

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      setSessionFiles((prev) => {
        const newState = { ...prev };
        delete newState[sessionId];
        return newState;
      });

      toast.success("Session deleted successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error(`Failed to delete session: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newState = { ...prev };
      newState[sessionId] = !newState[sessionId];

      if (newState[sessionId] && (!sessionFiles[sessionId] || sessionFiles[sessionId].length === 0)) {
        fetchSessionFiles(sessionId);
      }

      return newState;
    });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Folder className="h-4 w-4" />
          Manage Sessions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Previous Sessions & Files</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">No previous sessions found</p>
            <p className="text-sm text-muted-foreground">Start a new conversation to create a session</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between bg-muted p-3 cursor-pointer"
                    onClick={() => toggleSession(session.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedSessions[session.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <div className="font-medium">{session.title || `Session ${session.id.substring(0, 8)}...`}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(session.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSession(session.id);
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedSessions[session.id] && (
                    <div className="p-3 border-t bg-background">
                      <h4 className="text-sm font-medium mb-2">Files</h4>
                      {sessionFiles[session.id]?.length > 0 ? (
                        <div className="space-y-2">
                          {sessionFiles[session.id].map((file) => (
                            <div key={file.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-red-500" />
                                <div>
                                  <div className="text-sm font-medium">{file.name}</div>
                                  {/* <div className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)} • {formatDate(file.created_at)}
                                  </div> */}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => deleteFile(file.id, session.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">No files found for this session</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}