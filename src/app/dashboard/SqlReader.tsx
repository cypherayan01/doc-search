import { AppSidebar } from "../../components/app-sidebar"


import TextChatInterface from "../../components/TextChatInterface"


import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
//import { useState } from "react"

export default function Sqlreader() {
  //const [activeItem, setActiveItem] = useState("chat")



  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Features</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Text to Query</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {/*<div className="flex flex-1 flex-col gap-4 p-4">
            <h2 className="text-lg font-bold">Chat Box to be added..</h2>
           <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />  
        </div>*/}
        {/* <div className="h-full flex flex-col">
          <header className="border-b p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">{menuItems.find((item) => item.id === activeItem)?.label}</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {activeItem === "chat" && <ChatInterface />}
            {activeItem !== "chat" && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Content for {activeItem} goes here</p>
              </div>
            )}
          </main>
        </div> */}
        <TextChatInterface />
      </SidebarInset>
    </SidebarProvider>
  )
}

