"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

// Set this to your FastAPI backend URL
const BACKEND_URL = "http://localhost:8001";

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  data?: any // For storing query results
  sqlQuery?: string // For storing the generated SQL query
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploaded_at: string
}

export interface DatabaseTable {
  name: string
  columns: string[]
  sampleData?: any[]
}

export interface SessionState {
  sessionId: string | null
  messages: Message[]
  hasUploadedFile: boolean
  uploadedFile: UploadedFile | null
  dataPreview: any[] | null
  columns: string[] | null
  databaseTables: DatabaseTable[]
  schemaInfo: string
  selectedTable: string | null
}

export const useTextToQuerySession = () => {
  // Initialize session from localStorage if available
  const [sessionState, setSessionState] = useState<SessionState>(() => {
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem("textToQuerySession")
      if (savedSession) {
        try {
          return JSON.parse(savedSession)
        } catch (e) {
          console.error("Failed to parse saved session:", e)
        }
      }
    }
    return { 
      sessionId: null, 
      messages: [], 
      hasUploadedFile: false,
      uploadedFile: null,
      dataPreview: null,
      columns: null,
      databaseTables: [],
      schemaInfo: "",
      selectedTable: null
    }
  })

  const [isLoading, setIsLoading] = useState(false)

  // Persist session state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && sessionState.sessionId) {
      localStorage.setItem("textToQuerySession", JSON.stringify(sessionState))
    }
  }, [sessionState])

  const startNewSession = () => {
    setSessionState({ 
      sessionId: null, 
      messages: [], 
      hasUploadedFile: false,
      uploadedFile: null,
      dataPreview: null,
      columns: null,
      databaseTables: [],
      schemaInfo: "",
      selectedTable: null
    })
    localStorage.removeItem("textToQuerySession")
  }

  const fetchDatabaseSchema = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/schema`)
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status}`)
      }
      const data = await response.json()
      setSessionState(prev => ({
        ...prev,
        schemaInfo: data.schema
      }))
    } catch (error) {
      console.error("Error fetching schema:", error)
      toast.error(`Failed to fetch schema: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const fetchDatabaseTables = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/tables`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.status}`)
      }
      const data = await response.json()
      setSessionState(prev => ({
        ...prev,
        databaseTables: data.tables.map((table: string) => ({
          name: table,
          columns: []
        }))
      }))
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast.error(`Failed to fetch tables: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const previewTableData = async (tableName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/preview/${tableName}`)
      if (!response.ok) {
        throw new Error(`Failed to preview table: ${response.status}`)
      }
      const data = await response.json()
      
      setSessionState(prev => ({
        ...prev,
        selectedTable: tableName,
        dataPreview: data.data,
        columns: data.columns,
        databaseTables: prev.databaseTables.map(table => 
          table.name === tableName 
            ? { ...table, columns: data.columns, sampleData: data.data } 
            : table
        )
      }))
    } catch (error) {
      console.error("Error previewing table:", error)
      toast.error(`Failed to preview table: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      // Fetch session history
      const historyResponse = await fetch(`${BACKEND_URL}/sessions/${sessionId}/history`)
      
      if (!historyResponse.ok) {
        throw new Error(`Failed to load session history: ${historyResponse.status}`)
      }
      
      const historyData = await historyResponse.json()
      
      // Fetch session details and data preview
      const sessionResponse = await fetch(`${BACKEND_URL}/sessions/${sessionId}`)
      const sessionData = await sessionResponse.json()
      
      // Transform server messages to client format
      const messages: Message[] = historyData.history.map((msg: any) => ({
        id: msg.id || Date.now().toString(),
        role: msg.role,
        content: msg.content
      }))
      
      // Update session state
      setSessionState({
        sessionId,
        messages,
        hasUploadedFile: sessionData.data_info !== null,
        uploadedFile: sessionData.data_info ? {
          id: sessionId,
          name: sessionData.info.file_name || "data.csv",
          type: "text/csv",
          size: 0,
          uploaded_at: sessionData.info.created_at || new Date().toISOString()
        } : null,
        dataPreview: null,
        columns: null,
        databaseTables: [],
        schemaInfo: "",
        selectedTable: null
      })

      // Fetch database schema and tables for SQL Server sessions
      await fetchDatabaseSchema()
      await fetchDatabaseTables()
      
      toast.success("Session loaded successfully")
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error(`Failed to load session: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const sendQuery = async (query: string) => {
    if (!query.trim()) {
      toast.error("Query cannot be empty")
      return
    }

    setIsLoading(true)

    try {
      // Add user message to the chat
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: query
      }

      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }))

      // Send request to the backend
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          session_id: sessionState.sessionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse response" }))
        throw new Error(errorData.error || `Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Create assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        data: data.data,
        sqlQuery: data.sql_query
      }

      // Update session state
      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        columns: data.columns || prev.columns,
        dataPreview: data.data || prev.dataPreview
      }))
    } catch (error) {
      console.error("Error sending query:", error)
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Failed to get a response: ${error instanceof Error ? error.message : "Please try again"}`
      }

      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }))

      toast.error(`Failed to get a response: ${error instanceof Error ? error.message : "Please try again"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFile = async (file: File) => {
    setIsLoading(true);
  
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Use existing session ID or create new one
      const tempSessionId = sessionState.sessionId || crypto.randomUUID();
      formData.append("session_id", tempSessionId);
  
      // Make the POST request to upload endpoint
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "File upload failed");
      }
      
      // Use the session_id returned from the server
      const serverSessionId = data.session_id || tempSessionId;
      
      // Fetch updated session data
      const previewResponse = await fetch(`${BACKEND_URL}/preview/${serverSessionId}`);
      const previewData = await previewResponse.json();
  
      // Create the uploaded file info
      const uploadedFileInfo: UploadedFile = {
        id: serverSessionId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString()
      };
  
      // Update session state with the server's session_id
      setSessionState(prev => ({
        ...prev,
        sessionId: serverSessionId,
        hasUploadedFile: true,
        uploadedFile: uploadedFileInfo,
        dataPreview: previewData.preview,
        columns: previewData.columns,
        messages: [{
          id: Date.now().toString(),
          role: "assistant",
          content: `File "${file.name}" uploaded successfully. You can now ask questions about the data.`
        }]
      }));
  
      return true;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async () => {
    if (!sessionState.sessionId) {
      toast.error("No active session to delete")
      return false
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/sessions/${sessionState.sessionId}`, { 
        method: "DELETE" 
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete session")
      }

      const data = await response.json()
      
      if (data.success) {
        startNewSession()
        return true
      } else {
        throw new Error(data.message || "Failed to delete session")
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      toast.error(`Failed to delete session: ${error instanceof Error ? error.message : "Please try again"}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sessionId: sessionState.sessionId,
    messages: sessionState.messages,
    hasUploadedFile: sessionState.hasUploadedFile,
    uploadedFile: sessionState.uploadedFile,
    dataPreview: sessionState.dataPreview,
    columns: sessionState.columns,
    databaseTables: sessionState.databaseTables,
    schemaInfo: sessionState.schemaInfo,
    selectedTable: sessionState.selectedTable,
    isLoading,
    sendQuery,
    uploadFile,
    startNewSession,
    loadSession,
    deleteSession,
    previewTableData,
    fetchDatabaseSchema,
    fetchDatabaseTables,
    setSelectedTable: (tableName: string) => setSessionState(prev => ({
      ...prev,
      selectedTable: tableName
    }))
  }
}