"use client"

import { useRef, useEffect, useState } from "react"
import { Send, Globe, FileEdit, Paperclip, X, Loader2, PlusCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useChatSession } from "../services/ChatSessionManager"
import SessionManager from "./SessionManager"

export default function ChatInterface() {
  const {
    messages,
    sessionId,
    hasUploadedFiles,
    isLoading,
    sendMessage,
    uploadFiles,
    startNewSession,
    loadSession,
    deleteFile,
    uploadedFiles,
  } = useChatSession()

  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [height, setHeight] = useState("auto")
  const [showFilesManager, setShowFilesManager] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200)
      setHeight(`${newHeight}px`)
    }
  }, [input])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const pdfFiles = Array.from(e.target.files).filter(file => 
        file.type === 'application/pdf' || file.name.endsWith('.pdf')
      )
      if (pdfFiles.length < e.target.files.length) {
        toast.warning("Only PDF files are allowed")
      }
      setFiles((prev) => [...prev, ...pdfFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() && files.length === 0) return

    await sendMessage(input, files)
    setInput("")
    setFiles([])
  }

  const handleUploadOnly = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload")
      return
    }

    const success = await uploadFiles(files)
    if (success) {
      setFiles([])
    }
  }

  const handleSelectSession = (selectedSessionId: string) => {
    loadSession(selectedSessionId)
  }

  const handleDeleteFile = async (fileId: string) => {
    const success = await deleteFile(fileId)
    if (success) {
      toast.success("File deleted successfully")
    } else {
      toast.error("Failed to delete file")
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {sessionId ? `Chat Session: ${sessionId.substring(0, 8)}...` : "New Chat"}
        </h2>
        <div className="flex gap-2">
          <SessionManager onSelectSession={handleSelectSession} />
          <Button variant="outline" size="sm" onClick={startNewSession}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Files Manager Button - Similar to Session Manager */}
      {hasUploadedFiles && (
        <div className="mb-4">
          <Button 
            variant="outline" 
            className="w-full justify-between" 
            onClick={() => setShowFilesManager(!showFilesManager)}
          >
            <span>Manage Files</span>
            {showFilesManager ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {/* Files Manager Dropdown */}
          {showFilesManager && (
            <div className="mt-2 border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium mb-2">Uploaded Files</h3>
              {uploadedFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-slate-700">What do you want to know?</h1>
              {!hasUploadedFiles && sessionId && (
                <p className="mt-2 text-slate-500">Please upload files to begin</p>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.content}

                {/* Display attachments if any */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-3 w-3" />
                        <span>{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* File attachments preview */}
      {files.length > 0 && (
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Attachments</span>
            {sessionId && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUploadOnly}
                disabled={isLoading}
              >
                Upload Files Only
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="bg-muted rounded-md px-3 py-1 flex items-center gap-2 text-sm">
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => removeFile(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-input"
      >
        <div className="flex items-center px-3 py-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            style={{ height }}
            className="min-h-10 resize-none border-0 p-0 pl-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as any)
              }
            }}
          />

          <div className="flex gap-2">
            {/* Regular file upload button */}
            <div className="relative group">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap before:content-[''] before:absolute before:left-[10%] before:-bottom-1 before:border-4 before:border-transparent before:border-t-black">
                Attach any file (Max: 30MB)
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept=".pdf,.csv,.txt,.doc,.docx" 
              />
            </div>

            {/* PDF-only upload button */}
            <div className="relative group">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => pdfInputRef.current?.click()}
              >
                <FileEdit className="h-4 w-4" />
                <span className="sr-only">Attach PDF</span>
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap before:content-[''] before:absolute before:left-[10%] before:-bottom-1 before:border-4 before:border-transparent before:border-t-black">
                Attach PDF only (Max: 30MB)
              </div>
              <input 
                type="file" 
                ref={pdfInputRef} 
                onChange={handlePdfChange} 
                className="hidden" 
                multiple 
                accept=".pdf" 
              />
            </div>

            <div className="relative group">
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || (!input.trim() && files.length === 0)}
                className="h-8 w-8 rounded-full"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap before:content-[''] before:absolute before:left-[10%] before:-bottom-1 before:border-4 before:border-transparent before:border-t-black">
                Send message
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}