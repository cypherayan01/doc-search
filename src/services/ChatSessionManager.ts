"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

// Set this to your FastAPI backend URL
const BACKEND_URL = "http://localhost:8000"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: Array<{
    name: string
    type: string
    url: string
  }>
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploaded_at: string
}

export interface SessionState {
  sessionId: string | null
  messages: Message[]
  hasUploadedFiles: boolean
  uploadedFiles: UploadedFile[]
}

export const useChatSession = () => {
  // Initialize session from localStorage if available
  const [sessionState, setSessionState] = useState<SessionState>(() => {
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem("chatSession")
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
      hasUploadedFiles: false,
      uploadedFiles: []
    }
  })

  const [isLoading, setIsLoading] = useState(false)

  // Persist session state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && sessionState.sessionId) {
      localStorage.setItem("chatSession", JSON.stringify(sessionState))
    }
  }, [sessionState])

  const startNewSession = () => {
    setSessionState({ 
      sessionId: null, 
      messages: [], 
      hasUploadedFiles: false,
      uploadedFiles: []
    })
    localStorage.removeItem("chatSession")
  }

  const loadSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      // Fetch session history
      const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/history`)
      
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check if session has files
      const filesResponse = await fetch(`${BACKEND_URL}/files?session_id=${sessionId}`)
      const filesData = await filesResponse.json()
      const hasFiles = filesData.files && filesData.files.length > 0
      
      // Transform server messages to client format
      const messages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id || Date.now().toString(),
        role: msg.role,
        content: msg.content
      }))
      
      // Update session state
      setSessionState({
        sessionId,
        messages,
        hasUploadedFiles: hasFiles,
        uploadedFiles: filesData.files || []
      })
      
      toast.success("Session loaded successfully")
    } catch (error) {
      console.error("Error loading session:", error)
      toast.error(`Failed to load session: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (content: string, files: File[] = []) => {
    setIsLoading(true)

    try {
      // Create FormData to send files to the backend
      const formData = new FormData()
      formData.append("query", content)

      // Add the sessionId if we have one
      if (sessionState.sessionId) {
        formData.append("session_id", sessionState.sessionId)
      }

      // Add files to the formData if any
      files.forEach((file) => {
        formData.append("files", file)
      })

      // Create message attachments for UI preview
      const attachments = files.map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      }))

      // Add user message to the chat
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      setSessionState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }))

      // Send request to the backend
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse response" }))
        throw new Error(errorData.error || `Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Update session state with new session ID if provided
      if (data.session_id) {
        // Fetch updated files list after sending message
        const filesResponse = await fetch(`${BACKEND_URL}/files?session_id=${data.session_id}`)
        const filesData = await filesResponse.json()
        
        setSessionState((prev) => ({
          ...prev,
          sessionId: data.session_id,
          hasUploadedFiles: prev.hasUploadedFiles || files.length > 0,
          uploadedFiles: filesData.files || [],
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: data.answer || "Server busy try after some time.",
            },
          ],
        }))
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error(`Failed to get a response: ${error instanceof Error ? error.message : "Please try again"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFiles = async (files: File[]) => {
    if (!sessionState.sessionId) {
      toast.error("No active session. Please start a conversation first.")
      return false
    }

    if (files.length === 0) return false

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("session_id", sessionState.sessionId)

      files.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse response" }))
        throw new Error(errorData.error || `Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Fetch updated files list after upload
        const filesResponse = await fetch(`${BACKEND_URL}/files?session_id=${sessionState.sessionId}`)
        const filesData = await filesResponse.json()
        
        setSessionState((prev) => ({
          ...prev,
          hasUploadedFiles: true,
          uploadedFiles: filesData.files || [],
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: data.message || "Files uploaded successfully.",
            },
          ],
        }))
        toast.success("Files uploaded successfully!")
        return true
      } else {
        throw new Error(data.message || "Failed to upload files")
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast.error(`Failed to upload files: ${error instanceof Error ? error.message : "Please try again"}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!sessionState.sessionId) {
      toast.error("No active session.")
      return false
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/files/${fileId}?session_id=${sessionState.sessionId}`, { 
        method: "DELETE" 
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      const data = await response.json()
      
      if (data.success) {
        // Update the uploaded files list
        setSessionState(prev => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles.filter(file => file.id !== fileId)
        }))
        return true
      } else {
        throw new Error(data.message || "Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : "Please try again"}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sessionId: sessionState.sessionId,
    messages: sessionState.messages,
    hasUploadedFiles: sessionState.hasUploadedFiles,
    uploadedFiles: sessionState.uploadedFiles,
    isLoading,
    sendMessage,
    uploadFiles,
    startNewSession,
    loadSession,
    deleteFile,
  }
}