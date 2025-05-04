// src/components/app-layout.tsx
import { Outlet } from "react-router-dom"
import { AppSidebar } from "./app-sidebar"

export function AppLayout() {
  return (
    <div className="flex h-screen">
      <AppSidebar className="w-[280px] border-r" />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}