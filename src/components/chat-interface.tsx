"use client";

import { useRef, useEffect, useState, useCallback } from "react"
import { Send, FileEdit, Paperclip, X, Loader2, PlusCircle, User, Bot, MessageSquare, Upload, ChevronRight,
  ChevronLeft, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useChatSession } from "../services/ChatSessionManager"
import SessionManager from "./SessionManager"
import FileManager from "./FileManager"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

const PDFViewer = ({ file, initialPage = 1 }: { file: string, initialPage?: number }) => {
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1))
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 2))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))

  return (
    <div className="relative h-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 2}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            width={800}
            className="border-b border-gray-200 mx-auto"
            renderTextLayer={false}
          />
        </Document>
      </div>
    </div>
  )
}

const PdfModal = ({ 
  open, 
  onOpenChange, 
  pdfUrl,
  pageNumber = 1
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  pdfUrl: string | null;
  pageNumber?: number;
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={dialogRef}
        className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden"
        onInteractOutside={(e) => {
          if (dialogRef.current?.contains(e.target as Node)) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Document Viewer</DialogTitle>
        </DialogHeader>
        <div className="h-full">
          {pdfUrl ? (
            <PDFViewer file={pdfUrl} initialPage={pageNumber} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No document selected</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const extractPdfReference = (referenceText: string) => {
  const filenameMatch = referenceText.match(/\[([^\]]+\.pdf)(?:, page (\d+))?\]|Source: ([^\s]+\.pdf)(?: \(page (\d+))?\)/i)
  
  if (!filenameMatch) return null

  if (filenameMatch[1]) {
    return {
      filename: filenameMatch[1],
      page: filenameMatch[2] ? parseInt(filenameMatch[2]) : undefined
    }
  } else if (filenameMatch[3]) {
    return {
      filename: filenameMatch[3],
      page: filenameMatch[4] ? parseInt(filenameMatch[4]) : undefined
    }
  }

  return null
}

const FileChip = ({ file, onRemove, index }: { file: File, onRemove: (index: number) => void, index: number }) => {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => onRemove(index), 150)
  }

  return (
    <div className={`group bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200/60 rounded-xl px-3 py-2 flex items-center gap-2 text-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-300 ${
      isRemoving ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
    }`}>
      <div className="p-1 bg-indigo-100 rounded-full">
        <Paperclip className="h-3 w-3 text-indigo-600" />
      </div>
      <span className="truncate max-w-[120px] font-medium text-indigo-900">{file.name}</span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 rounded-full opacity-60 hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all duration-200 group-hover:scale-110" 
        onClick={handleRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

const MessageBubble = ({ message, isLoading = false }: { message: any, isLoading?: boolean }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [currentPdf, setCurrentPdf] = useState<{url: string, page?: number} | null>(null)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const isUser = message.role === "user"

  const handleReferenceClick = (referenceText: string) => {
    const pdfData = extractPdfReference(referenceText)
    if (pdfData) {
      setCurrentPdf({
        url: `/api/documents/${pdfData.filename}`,
        page: pdfData.page
      })
      setIsPdfModalOpen(true)
    } else {
      toast.info(`Reference: ${referenceText}`)
    }
  }

  const formatMessageContent = (text: string, isUserMessage: boolean) => {
    if (!text) return null

    const referenceRegex = /(\n\[[^\]]+\]|\nSource:[^\n]+)/gi
    const parts = text.split(referenceRegex)
    
    return parts.map((part, index) => {
      if (!part.trim()) return null
      
      const isReference = referenceRegex.test(part)
      
      if (isReference) {
        const referenceText = part.trim()
        const isSource = referenceText.startsWith('Source:')
        
        return (
          <div 
            key={`ref-${index}`} 
            className={`mb-4 last:mb-0 group transition-all duration-300 cursor-pointer`}
            onClick={() => handleReferenceClick(referenceText)}
          >
            <div className={`flex items-start gap-2 p-3 rounded-lg border-l-4 ${
              isSource 
                ? 'bg-blue-50/70 border-l-blue-400 hover:bg-blue-100/50 text-blue-900'
                : 'bg-purple-50/70 border-l-purple-400 hover:bg-purple-100/50 text-purple-900'
            }`}>
              <div className={`flex-shrink-0 mt-0.5 p-1 rounded-full ${
                isSource 
                  ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                  : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
              }`}>
                <ChevronRight className="h-3 w-3" />
              </div>
              <div className="text-xs font-medium">
                {referenceText}
                <div className={`mt-1 text-[0.7rem] ${
                  isSource ? 'text-blue-700/70' : 'text-purple-700/70'
                }`}>
                  {isSource ? 'Click to view source' : 'Click to view reference'}
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      const paragraphs = part.split(/\n\s*\n/).filter(p => p.trim())
      
      return paragraphs.map((paragraph, pIndex) => (
        <p key={`p-${index}-${pIndex}`} className={`mb-4 last:mb-0 text-left leading-relaxed ${
          isUserMessage ? 'text-indigo-900' : 'text-gray-800'
        }`}>
          {paragraph.split(/(\*\*[^*]+\*\*)/g).map((segment, sIndex) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return (
                <strong key={`bold-${sIndex}`} className={`font-semibold ${
                  isUserMessage 
                    ? 'text-indigo-800 bg-indigo-100/70 px-1 rounded'
                    : 'text-gray-900 bg-gradient-to-r from-amber-100 to-yellow-100 px-1 rounded'
                }`}>
                  {segment.slice(2, -2)}
                </strong>
              )
            }
            return segment
          })}
        </p>
      ))
    })
  }

  return (
    <>
      <div 
        className={`flex items-start gap-4 transition-all duration-500 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        } ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div className={`flex-shrink-0 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shadow-sm border-2 transition-all duration-300 hover:scale-110 ${
            isUser 
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-200 text-white" 
              : "bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-200 text-indigo-700"
          }`}>
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className={`h-4 w-4 ${isLoading ? 'animate-bounce' : ''}`} />
            )}
          </div>
        </div>
        
        <div className={`flex max-w-[75%] ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
            isUser 
              ? "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200" 
              : "bg-gradient-to-br from-white to-indigo-50 border-indigo-100"
          }`}>
            <div className="text-sm leading-relaxed">
              {formatMessageContent(message.content, isUser)}
            </div>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment: any, index: number) => (
                  <div key={index} className={`flex items-center gap-2 text-xs p-2 rounded-lg transition-colors ${
                    isUser ? 'bg-indigo-100/50' : 'bg-indigo-50/70'
                  }`}>
                    <Paperclip className="h-3 w-3 opacity-70" />
                    <span className="truncate">{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}

            {isLoading && !isUser && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                <span className="text-xs opacity-70">AI is thinking...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <PdfModal 
        open={isPdfModalOpen} 
        onOpenChange={setIsPdfModalOpen} 
        pdfUrl={currentPdf?.url || null}
        pageNumber={currentPdf?.page}
      />
    </>
  )
}

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
  } = useChatSession()

  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [height, setHeight] = useState("auto")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const dummyQuestions = [
    "What does GST stand for?",
    "Which department issued the GST Update for August 2023?",
    "What does ITC stand for in the context of GST?",
    "What is the purpose of Notification No. 36/2023-Central Tax?",
    "What is the impact of Section 67(2) of the CGST Act on cash seizures?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200)
      setHeight(`${newHeight}px`)
    }
  }, [input])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
      toast.success(`Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`)
    }
  }, [])

  const handlePdfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const pdfFiles = Array.from(e.target.files).filter(file => 
        file.type === 'application/pdf' || file.name.endsWith('.pdf')
      )
      if (pdfFiles.length < e.target.files.length) {
        toast.warning("Only PDF files are allowed")
      }
      setFiles(prev => [...prev, ...pdfFiles])
      if (pdfFiles.length > 0) {
        toast.success(`Added ${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''}`)
      }
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

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

  const canSubmit = (input.trim() || files.length > 0) && !isLoading

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-gradient-to-b from-white to-indigo-50/20">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-indigo-100/60 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-indigo-900">
                {sessionId ? `Session ${sessionId.substring(0, 8)}...` : "New Chat"}
              </h2>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span>Active</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {sessionId && hasUploadedFiles && (
              <FileManager 
                sessionId={sessionId} 
                onDeleteFile={deleteFile} 
              />
            )}
            <SessionManager onSelectSession={loadSession} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startNewSession} 
              className="hover:bg-indigo-50 border-indigo-200 text-indigo-700 hover:text-indigo-800"
            >
              <PlusCircle className="h-4 w-4 mr-2 text-indigo-600" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
                <MessageSquare className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-indigo-900 mb-2">
                  What would you like to explore?
                </h1>
                {!hasUploadedFiles && sessionId && (
                  <p className="text-indigo-700/70">Upload files to get started with document analysis</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <MessageBubble 
                message={{ role: "assistant", content: "" }} 
                isLoading={true} 
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-indigo-100/60 px-6 py-4">
        {messages.length === 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-indigo-700 mb-2">Quick questions:</h3>
            <div className="flex flex-wrap gap-2">
              {dummyQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-100 transition-all duration-200 hover:shadow-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-indigo-700">
                Attachments ({files.length})
              </span>
              {sessionId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUploadOnly}
                  disabled={isLoading}
                  className="hover:bg-indigo-50 border-indigo-200 text-indigo-700 hover:text-indigo-800"
                >
                  <Upload className="h-4 w-4 mr-2 text-indigo-600" />
                  Upload Only
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <FileChip 
                  key={`${file.name}-${index}`} 
                  file={file} 
                  onRemove={removeFile} 
                  index={index} 
                />
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className={`relative border-2 rounded-2xl transition-all duration-300 ${
            isInputFocused 
              ? 'border-indigo-300 shadow-lg shadow-indigo-100' 
              : 'border-indigo-100 hover:border-indigo-200'
          }`}>
            <div className="flex items-end px-4 py-3 gap-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Ask anything..."
                style={{ height }}
                className="min-h-[2.5rem] resize-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm placeholder:text-indigo-400/60"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
              />

              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-200"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <FileEdit className="h-4 w-4" />
                </Button>

                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSubmit}
                  className={`h-8 w-8 rounded-full transition-all duration-300 ${
                    canSubmit 
                      ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:scale-110 shadow-lg' 
                      : 'bg-indigo-100 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple 
            accept=".pdf,.csv,.txt,.doc,.docx" 
          />
          <input 
            type="file" 
            ref={pdfInputRef} 
            onChange={handlePdfChange} 
            className="hidden" 
            multiple 
            accept=".pdf" 
          />
        </form>

        <div className="flex justify-between items-center mt-2 text-xs text-indigo-500/70">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {input.length > 0 && (
            <span className={input.length > 1000 ? 'text-amber-500' : ''}>
              {input.length}/2000
            </span>
          )}
        </div>
      </div>
    </div>
  )
}