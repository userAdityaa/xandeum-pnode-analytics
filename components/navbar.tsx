"use client"

import { useState, useEffect } from "react"
import { Search, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Navbar() {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(30)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          // Reset to 30 when it reaches 0
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4">      
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold text-sidebar-foreground">Dashboard</h1>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sidebar-foreground/50" />
          <Input
            type="search"
            placeholder="Search nodes... (Press Enter)"
            className="w-full bg-background/50 pl-8 text-sm border-zinc-800 focus-visible:ring-zinc-800"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Next refresh {timeUntilRefresh}s</span>
        </Button>
        
        {/* <Button variant="ghost" size="sm">
          Ask AI
        </Button> */}
      </div>
    </header>
  )
}
