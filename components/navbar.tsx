"use client"


import { useState, useEffect } from "react"
import { Search, Download, RefreshCw, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import NodeSearchBar from "@/components/node-search-bar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useRefresh } from "@/lib/refresh-context"
import * as Popover from '@radix-ui/react-popover'

export default function Navbar() {
  const { timeUntilRefresh } = useRefresh()
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function downloadFile(url: string, filename: string) {
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Export Failed");
      }
      let blob;
      if (filename.endsWith('.json')) {
        const data = await res.json();
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      } else if (filename.endsWith('.csv')) {
        const data = await res.text();
        blob = new Blob([data], { type: 'text/csv' });
      } else {
        blob = await res.blob();
      }
      const href = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(href);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4">      
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold text-sidebar-foreground">Dashboard</h1>
        
        <NodeSearchBar className="flex-1 max-w-md" />
      </div>

      <div className="flex items-center gap-2">

        <Popover.Root open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
          <Popover.Trigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </Popover.Trigger>
          <Popover.Content align="end" className="z-50 bg-sidebar border border-sidebar-border rounded shadow-lg p-2 min-w-[120px]">
            <button
              className="w-full text-left px-3 py-2 hover:bg-sidebar-accent rounded"
              onClick={async () => {
                setExportPopoverOpen(false);
                await downloadFile("/api/export/csv", "dashboard.csv");
              }}
            >Export as CSV</button>
            <button
              className="w-full text-left px-3 py-2 hover:bg-sidebar-accent rounded"
              onClick={async () => {
                setExportPopoverOpen(false);
                await downloadFile("/api/export/json", "dashboard.json");
              }}
            >Export as JSON</button>
          </Popover.Content>
        </Popover.Root>
              {downloading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
                  <div className="flex flex-col items-center gap-2 p-6 bg-sidebar border border-sidebar-border rounded-xl shadow-xl">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  </div>
                </div>
              )}
        
        <Button variant="ghost" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Next refresh {timeUntilRefresh}s</span>
        </Button>
      </div>
    </header>
  )
}
