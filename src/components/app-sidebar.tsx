import type * as React from "react"
import { useLocation } from "react-router-dom"
import { SearchForm } from "./search-form"
import { VersionSwitcher } from "./version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  versions: ["llama3-70b-8192", "qwen-2.5-32b", "deepseek-r1-distill-llama-70b"],
  navMain: [
    {
      title: "Features",
      url: "#",
      items: [
        {
          title: "Pdf Search",
          url: "/page",
          isActive: false,
        },
        {
          title: "Text to Query", 
          url: "/sqlReader",
        },
        {
          title: "Data Summarizer",
          url: "/data-summarizer",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  
  // Determine if we're on a chat-related route
  const isChatRoute = location.pathname.startsWith('/chat') || 
                     location.pathname === '/pdf-search' || 
                     location.pathname === '/text-to-query' || 
                     location.pathname === '/data-summarizer'

  // Update active state based on current route
  const navItems = data.navMain.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      isActive: location.pathname === item.url
    }))
  }))

  // Collapsed version for chat routes
  if (isChatRoute) {
    return (
      <Sidebar {...props} className="hidden md:block md:w-20 lg:w-64 transition-all duration-300 bg-gradient-to-b from-white to-indigo-50/20 border-r border-indigo-100">
        <SidebarHeader className="px-2 md:px-4">
          <div className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md">
            <VersionSwitcher 
              versions={data.versions} 
              defaultVersion={data.versions[0]}
            />
          </div>
          <SearchForm className="hidden lg:block" />
        </SidebarHeader>
        <SidebarContent>
          {navItems.map((item) => (
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel className="hidden lg:block text-indigo-800/80">
                {item.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={item.isActive}
                        className={`justify-center lg:justify-start
                          ${item.isActive 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'text-indigo-700 hover:bg-indigo-50'}`}
                      >
                        <a href={item.url}>
                          <span className="hidden lg:inline">{item.title}</span>
                          <span className="lg:hidden">
                            {item.title.split(' ').map(word => word[0]).join('')}
                          </span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail className="bg-indigo-50" />
      </Sidebar>
    )
  }

  // Full sidebar for non-chat routes
  return (
    <Sidebar {...props} className="w-64 bg-gradient-to-b from-white to-indigo-50/20 border-r border-indigo-100">
      <SidebarHeader className="px-4">
        <div className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md">
          <VersionSwitcher 
            versions={data.versions} 
            defaultVersion={data.versions[0]}
          />
        </div>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-indigo-800/80">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={item.isActive}
                      className={`${item.isActive 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-indigo-700 hover:bg-indigo-50'}`}
                    >
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail className="bg-indigo-50" />
    </Sidebar>
  )
}