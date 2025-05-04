"use client"

import { useState, useEffect } from "react"
import { Send, Database, Table, X, Loader2, PlusCircle, User, Bot, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTextToQuerySession } from "../services/TextToQuerySessionManager"
import { useRef } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type QueryResultRow = Record<string, any>;

export default function TextChatInterface() {
  const {
    sessionId,
    messages,
    isLoading,
    sendQuery,
    startNewSession,
    databaseTables,
    schemaInfo,
    selectedTable,
    dataPreview,
    columns,
    previewTableData,
    fetchDatabaseSchema,
    fetchDatabaseTables,
    setSelectedTable
  } = useTextToQuerySession()

  const [input, setInput] = useState("")
  const [height, setHeight] = useState("auto")
  const [isTablesLoading, setIsTablesLoading] = useState(false)
  const [showTablePreview, setShowTablePreview] = useState(false)
  const [showSchemaInfo, setShowSchemaInfo] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchSchemaAndTables = async () => {
    try {
      setIsTablesLoading(true)
      await fetchDatabaseSchema()
      await fetchDatabaseTables()
    } catch (error) {
      toast.error("Failed to load database information")
    } finally {
      setIsTablesLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) {
      fetchSchemaAndTables()
    }
  }, [sessionId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200)
      setHeight(`${newHeight}px`)
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendQuery(input)
    setInput("")
  }

  const handlePreviewTable = async () => {
    if (!selectedTable) {
      toast.error("Please select a table first")
      return
    }
    await previewTableData(selectedTable)
    setShowTablePreview(true)
  }

  const renderMessageData = (data: QueryResultRow[]) => {
    if (!data || data.length === 0) return null;

    const dataKeys = Object.keys(data[0]);

    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">Results:</h4>
        <div className="bg-white rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {dataKeys.map((key) => (
                  <th key={key} className="p-2 text-left border-b">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b">
                  {dataKeys.map((key) => (
                    <td key={`${i}-${key}`} className="p-2">
                      {row[key] !== null ? String(row[key]) : "NULL"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[60rem] mx-auto pt-4 pb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {sessionId ? `Database Session: PFMS_UP` : "New Database Session"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startNewSession}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Database Schema Panel */}
        <div className="bg-muted rounded-lg p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Schema
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSchemaAndTables}
              disabled={isLoading || isTablesLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTablesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Database Tables</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchDatabaseTables}
                  disabled={isTablesLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isTablesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Select 
                value={selectedTable || ""} 
                onValueChange={setSelectedTable}
                disabled={isTablesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    isTablesLoading ? "Loading tables..." : 
                    databaseTables?.length ? "Select a table" : "No tables available"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isTablesLoading ? (
                    <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading tables...
                    </div>
                  ) : databaseTables?.length ? (
                    databaseTables.map((table) => (
                      <SelectItem key={table.name} value={table.name}>
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          {table.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No tables available
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button 
                className="w-full"
                size="sm" 
                onClick={handlePreviewTable}
                disabled={!selectedTable || isTablesLoading}
              >
                Preview Table Data
              </Button>
            </div>

            {showTablePreview && columns && dataPreview && (
              <div className="bg-white rounded-md border overflow-hidden relative">
                <button 
                  onClick={() => setShowTablePreview(false)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close table preview"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="p-2 text-left border-b">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataPreview.map((row: QueryResultRow, i: number) => (
                        <tr key={i} className="border-b">
                          {columns.map((col) => (
                            <td key={`${i}-${col}`} className="p-2">
                              {row[col] !== null ? String(row[col]) : "NULL"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {schemaInfo && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Schema Information</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSchemaInfo(!showSchemaInfo)}
                  >
                    {showSchemaInfo ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </>
                    ) : (
                      "Show Schema"
                    )}
                  </Button>
                </div>
                {showSchemaInfo && (
                  <div className="relative bg-gray-800 rounded-md p-3">
                    <button 
                      onClick={() => setShowSchemaInfo(false)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-700 transition-colors"
                      aria-label="Close schema info"
                    >
                      <X className="h-4 w-4 text-gray-300" />
                    </button>
                    <pre className="text-gray-100 overflow-x-auto text-xs max-h-100">
                      {schemaInfo}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h1 className="text-3xl font-semibold text-slate-700">Query Your Database</h1>
                  <p className="mt-2 text-slate-500">
                    Ask natural language questions about your PFMS_UP database
                  </p>
                  <div className="mt-4 space-y-2 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium">Try questions like:</p>
                    <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                      <li>"Show me all customers with overdue payments"</li>
                      <li>"What's the total revenue by product category?"</li>
                      <li>"List transactions above $1000 from last month"</li>
                    </ul>
                  </div>
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
                        <div className="whitespace-pre-wrap">
                          {message.content}
                          {message.sqlQuery && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Generated SQL:</h4>
                              <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto text-xs">
                                {message.sqlQuery}
                              </pre>
                            </div>
                          )}
                          {message.data && renderMessageData(message.data)}
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
                  <span>Generating SQL query...</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-input"
          >
            <div className="flex items-center px-3 py-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your database..."
                style={{ height }}
                className="min-h-10 resize-none border-0 p-0 pl-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />

              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-8 w-8 rounded-full ml-2"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}