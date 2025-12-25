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
import { usePathname } from "next/navigation"

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
    { title: "Network", icon: Box, href: "/network" },
  ],
}

const resourcesSection = {
  title: "Resources",
  items: [
    { title: "Documentation", icon: BookOpen, href: "/docs", hasSubmenu: true },
  ],
}

export function AppSidebar() {
  const { toggleSidebar, state } = useSidebar()
  const pathname = usePathname()
  
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border mt-14">
      <SidebarHeader className="border-b border-sidebar-border relative">
        <SidebarMenu>
          <SidebarMenuItem>
              <SidebarMenuButton size="lg" className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 ${state === "collapsed" ? "ml-4" : ""}`}>
              <div className="flex aspect-square size-12 items-center justify-center shrink-0 overflow-hidden p-0">
                <img
                  src="/logo.png"
                  alt="App Logo"
                  className="object-contain w-12 h-12 scale-150"
                  width={120}
                  height={120}
                  style={{ display: 'block' }}
                />
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
          className="absolute -right-8 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-linear-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_1px_3px_0_rgba(0,0,0,0.2)] hover:from-white/20 hover:to-white/10 flex items-center justify-center transition-all"
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
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className={`${state === "collapsed" ? "ml-4 mt-4" : ""}`}
                  >
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

        {state === "collapsed" && <div className="my-2 border-t border-sidebar-border mx-2" />}
        <SidebarGroup>
          <SidebarGroupLabel>{pNodesSection.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pNodesSection.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname?.startsWith(item.href + '/')}
                    tooltip={item.title}
                    className={`${state === "collapsed" ? "ml-4" : ""}`}
                  >
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

        {state === "collapsed" && <div className="my-2 border-t border-sidebar-border mx-2" />}
        <SidebarGroup>
          <SidebarGroupLabel>{resourcesSection.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Documentation Section */}
              <Collapsible
                key="Documentation"
                defaultOpen={pathname?.startsWith("/docs")}
                open={pathname?.startsWith("/docs")}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      asChild
                      tooltip="Documentation" 
                      isActive={pathname?.startsWith("/docs")}
                      onClick={e => {
                        if (!pathname?.startsWith("/docs/about")) {
                          window.location.href = "/docs/about";
                        }
                      }}
                      className={`${state === "collapsed" ? "ml-4" : ""}`}
                    >
                      <a href="#">
                        <BookOpen />
                        <span>Documentation</span>
                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </a>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/docs/about"}
                          className="mt-2"
                        >
                          <a href="/docs/about">About</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === "/docs/api"}>
                          <a href="/docs/api">API Documentation</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === "/docs/architecture"}>
                          <a href="/docs/architecture">System Architecture</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
