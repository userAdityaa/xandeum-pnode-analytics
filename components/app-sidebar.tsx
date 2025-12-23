"use client"

import { Home, Network, Box, TrendingUp, Link2, BookOpen, Settings, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const navigation = [
  {
    title: "Overview",
    icon: Home,
    href: "/",
  },
]

const pNodesSection = {
  title: "Analysis",
  items: [
    { title: "pNodes", icon: Network, href: "/pnodes" },
    { title: "Storage", icon: Box, href: "/storage" },
  ],
}

const resourcesSection = {
  title: "Resources",
  items: [
    { title: "Documentation", icon: BookOpen, href: "/docs", hasSubmenu: true },
  ],
}

const settingsSection = {
  title: "Settings",
  items: [
    { title: "Settings", icon: Settings, href: "/settings" },
  ],
}

export function AppSidebar() {
  const { toggleSidebar, state } = useSidebar()
  
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border mt-14">
      <SidebarHeader className="border-b border-sidebar-border relative">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600 text-white shrink-0">
                <span className="text-lg font-bold">X</span>
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">Xandeum Analytics</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Online
                  </span>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <button 
          onClick={toggleSidebar}
          className="absolute -right-8 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_1px_3px_0_rgba(0,0,0,0.2)] hover:from-white/20 hover:to-white/10 flex items-center justify-center transition-all"
        >
          {state === "expanded" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive tooltip={item.title}>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{pNodesSection.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pNodesSection.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{resourcesSection.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourcesSection.items.map((item) => (
                <Collapsible key={item.title} defaultOpen={false} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <a href="/docs/getting-started">Getting Started</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <a href="/docs/api">API Reference</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{settingsSection.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsSection.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
