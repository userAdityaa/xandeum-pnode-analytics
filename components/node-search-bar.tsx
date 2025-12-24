"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface NodeSuggestion {
  id: string
  version: string
  pubkey?: string
}

interface NodeSearchBarProps {
  nodesApiUrl?: string // Optionally override API endpoint
  placeholder?: string
  className?: string
}

export default function NodeSearchBar({ nodesApiUrl = "/api/pnodes", placeholder = "Search IP, Pubkey...", className = "" }: NodeSearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    let ignore = false
    fetch(nodesApiUrl)
      .then(res => res.json())
      .then(data => {
        if (ignore) return
        const q = query.toLowerCase()
        const filtered = (data.pNodes || []).filter((n: any) =>
          n.id.toLowerCase().includes(q) || (n.pubkey && n.pubkey.toLowerCase().includes(q))
        ).slice(0, 8)
        setSuggestions(filtered)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { ignore = true }
  }, [query, nodesApiUrl])

  function handleSelect(node: NodeSuggestion) {
    setShowSuggestions(false)
    setQuery("")
    // Navigate to /pnodes with search param
    router.push(`/pnodes?search=${encodeURIComponent(node.id)}`)
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sidebar-foreground/50" />
      <Input
        type="search"
        placeholder={placeholder}
        className="w-full bg-background/50 pl-8 text-sm border-zinc-800 focus-visible:ring-zinc-800"
        value={query}
        onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
        autoComplete="off"
      />
      {showSuggestions && (
        <div className="absolute left-0 right-0 mt-1 bg-sidebar border border-sidebar-border rounded shadow-lg z-50 max-h-60 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center px-4 py-3">
              <span className="inline-block w-1.5 h-1.5 mx-0.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="inline-block w-1.5 h-1.5 mx-0.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
              <span className="inline-block w-1.5 h-1.5 mx-0.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              <style jsx>{`
                @keyframes bounce {
                  0%, 80%, 100% { transform: scale(1); }
                  40% { transform: scale(1.5); }
                }
                .animate-bounce {
                  animation: bounce 1s infinite;
                }
              `}</style>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map(node => (
              <div
                key={node.id}
                className="px-4 py-2 cursor-pointer hover:bg-sidebar-accent text-sm text-sidebar-foreground"
                onMouseDown={() => handleSelect(node)}
              >
                <span className="font-mono">{node.id}</span>
                {node.pubkey && <span className="ml-2 text-xs text-sidebar-foreground/60">{node.pubkey.slice(0, 12)}...</span>}
                <span className="ml-2 text-xs text-sidebar-foreground/40">{node.version}</span>
              </div>
            ))
          ) : query.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-sidebar-foreground/60">No Node match found</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
