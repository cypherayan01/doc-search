"use client"

import { useRef, useEffect, useState } from "react"
import { Send, FileEdit, Paperclip, X, Loader2, PlusCircle, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useChatSession } from "../services/ChatSessionManager"
import SessionManager from "./SessionManager"
import FileManager from "./FileManager" 

/**
 * Improved text formatter with better paragraph handling and controlled bold styling
 */
const formatResponseText = (text: string) => {
  if (!text) return null;

  // First separate references (lines starting with [ or containing "Source:")
  const referenceRegex = /(\n\[[^\]]+\]|\nSource:[^\n]+)/gi;
  const parts = text.split(referenceRegex);
  
  return parts.map((part, index) => {
    if (!part.trim()) return null;
    
    // Check if this part is a reference
    const isReference = referenceRegex.test(part);
    
    if (isReference) {
      return (
        <p key={`ref-${index}`} className="mb-4 last:mb-0 text-sm text-muted-foreground italic">
          {part.trim()}
        </p>
      );
    }
    
    // Regular content - split into paragraphs
    const paragraphs = part.split(/\n\s*\n/).filter(p => p.trim());
    
    return paragraphs.map((paragraph, pIndex) => (
      <p key={`p-${index}-${pIndex}`} className="mb-4 last:mb-0 text-left">
        {paragraph.split(/(\*\*[^*]+\*\*)/g).map((segment, sIndex) => {
          // Only bold text that's explicitly marked with ** **
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return (
              <strong key={`bold-${sIndex}`} className="font-semibold">
                {segment.slice(2, -2)}
              </strong>
            );
          }
          return segment;
        })}
      </p>
    ));
  });
};

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
    //uploadedFiles,
  } = useChatSession()

  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [height, setHeight] = useState("auto")
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
    
    const currentInput = input
    const currentFiles = [...files]
    
    setInput("")
    setFiles([])
    
    await sendMessage(currentInput, currentFiles)
  }

  const handleUploadOnly = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload")
      return
    }

    const currentFiles = [...files]
    setFiles([])
    
    const success = await uploadFiles(currentFiles)
    if (!success) {
      toast.error("Failed to upload files")
    }
  }

  const handleSelectSession = (selectedSessionId: string) => {
    loadSession(selectedSessionId)
  }

  const handleDeleteFile = async (fileId: string) => {
    return await deleteFile(fileId)
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[60rem] mx-auto pt-4 pb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {sessionId ? `Chat Session: ${sessionId.substring(0, 8)}...` : "New Chat"}
        </h2>
        <div className="flex gap-2">
          {sessionId && hasUploadedFiles && (
            <FileManager 
              sessionId={sessionId} 
              onDeleteFile={handleDeleteFile} 
            />
          )}
          <SessionManager onSelectSession={handleSelectSession} />
          <Button variant="outline" size="sm" onClick={startNewSession}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

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
            <div key={message.id} className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${message.role === "user" ? "order-last" : "order-first"}`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full 
                  ${message.role === "user" ? "bg-primary" : "bg-slate-200"}`}>
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-slate-700" />
                  )}
                </div>
              </div>
              
              <div className={`flex max-w-[80%] ${message.role === "user" ? "justify-end ml-auto" : "justify-start mr-auto"}`}>
                <div
                  className={`rounded-lg p-4 text-left ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}
                >
                  {message.role === "user" ? (
                    message.content
                  ) : (
                    formatResponseText(message.content)
                  )}

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
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200">
                <Bot className="h-4 w-4 text-slate-700" />
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

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