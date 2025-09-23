"use client"

import { useState } from "react"
import { Search, Activity, BarChart3, MessageCircle, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInterface } from "@/components/search-interface"
import { HealthMonitor } from "@/components/health-monitor"
import { StatsDisplay } from "@/components/stats-display"
import { ChatInterface } from "@/components/chat-interface"

export default function BengaliRAGSystem() {
  const [activeTab, setActiveTab] = useState<"search" | "chat" | "health" | "stats">("search")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    { id: "search", label: "Search", icon: Search, description: "Search Bengali documents" },
    { id: "chat", label: "Chat", icon: MessageCircle, description: "Interactive Q&A" },
    { id: "health", label: "Health", icon: Activity, description: "System status" },
    { id: "stats", label: "Statistics", icon: BarChart3, description: "Usage analytics" },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">podder_soykot</h1>
                <p className="text-sm text-sidebar-foreground/60 mt-1">question answering</p>
              </div>
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                127.0.0.1:8000
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigationItems.map(({ id, label, icon: Icon, description }) => (
                <Button
                  key={id}
                  variant={activeTab === id ? "secondary" : "ghost"}
                  onClick={() => {
                    setActiveTab(id as any)
                    setSidebarOpen(false)
                  }}
                  className={`w-full justify-start h-auto p-3 ${
                    activeTab === id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs opacity-60">{description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/50">Advanced Bengali language processing</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-background border-b border-border px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-2xl font-semibold text-foreground capitalize">
                  {activeTab === "stats" ? "Statistics" : activeTab}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {navigationItems.find((item) => item.id === activeTab)?.description}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {activeTab === "search" && <SearchInterface />}
            {activeTab === "chat" && <ChatInterface />}
            {activeTab === "health" && <HealthMonitor />}
            {activeTab === "stats" && <StatsDisplay />}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
