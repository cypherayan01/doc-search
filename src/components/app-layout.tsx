import { Outlet } from "react-router-dom"
import { AppSidebar } from "./app-sidebar"

export function AppLayout() {
  return (
    <div className="flex h-screen">
      <AppSidebar className="border-r" />
      <div className="flex-1 overflow-auto w-full">
        <Outlet />
      </div>
    </div>
  )
}