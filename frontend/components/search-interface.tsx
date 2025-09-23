"use client"

import type React from "react"

import { useState } from "react"
import { Search, Loader2, FileText, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

interface SearchResult {
  id: string
  content: string
  score: number
  metadata?: Record<string, any>
}

const popularQueries = [
  { query: "রবীন্দ্রনাথ ঠাকুর", translation: "Rabindranath Tagore", category: "Literature" },
  { query: "বাংলাদেশের ইতিহাস", translation: "History of Bangladesh", category: "History" },
  { query: "কাজী নজরুল ইসলাম", translation: "Kazi Nazrul Islam", category: "Literature" },
  { query: "বাংলা ভাষা আন্দোলন", translation: "Bengali Language Movement", category: "History" },
  { query: "শরৎচন্দ্র চট্টোপাধ্যায়", translation: "Sarat Chandra Chattopadhyay", category: "Literature" },
  { query: "মুক্তিযুদ্ধ", translation: "Liberation War", category: "History" },
]

export function SearchInterface() {
  const [query, setQuery] = useState("")
  const [k, setK] = useState("5")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(query)}&k=${k}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Map similarity_score to score for frontend compatibility
      const mappedResults = (data.results || data || []).map((result: any) => ({
        ...result,
        score: typeof result.similarity_score === 'number' ? result.similarity_score : 0,
        content: result.question || result.content || '',
      }))
      setResults(mappedResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while searching")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handlePopularQuery = (popularQuery: string) => {
    setQuery(popularQuery)
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Advanced Bengali RAG System</span>
        </div>
        <h2 className="text-5xl font-bold text-balance tracking-tight">Bengali Text Search</h2>
        <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
          Search through Bengali documents using advanced retrieval techniques powered by AI
        </p>
        <p className="text-base text-muted-foreground/80">বাংলা নথিপত্রে উন্নত অনুসন্ধান প্রযুক্তি ব্যবহার করে খোঁজ করুন</p>
      </div>

      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-5 h-5 text-primary" />
            Popular Queries
          </CardTitle>
          <CardDescription className="text-base">Click on any query to search instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularQueries.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 bg-card/30 border-border/50"
                onClick={() => handlePopularQuery(item.query)}
              >
                <div className="space-y-2 w-full">
                  <div className="font-medium text-foreground text-base">{item.query}</div>
                  <div className="text-sm text-muted-foreground">{item.translation}</div>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {item.category}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="w-5 h-5 text-primary" />
            Search Query
          </CardTitle>
          <CardDescription className="text-base">Enter your search query in Bengali or English</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="query" className="text-sm font-medium text-foreground">
                Query
              </Label>
              <Input
                id="query"
                placeholder="রবীন্দ্রনাথ ঠাকুর (e.g., Rabindranath Tagore)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-base h-12 mt-2 bg-input/50 border-border/50"
              />
            </div>
            <div className="w-32">
              <Label htmlFor="k" className="text-sm font-medium text-foreground">
                Results
              </Label>
              <Input
                id="k"
                type="number"
                min="1"
                max="20"
                value={k}
                onChange={(e) => setK(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 mt-2 bg-input/50 border-border/50"
              />
            </div>
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search Documents
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Error: {error}. Make sure your API server is running on 127.0.0.1:8000.</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Search Results</h3>
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid gap-6">
            {results.map((result, index) => (
              <Card
                key={result.id || index}
                className="hover:bg-card/80 transition-all duration-200 border-l-4 border-l-primary/50 bg-card/30 border-border/50"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Result {index + 1}
                    </CardTitle>
                    <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/30">
                      Score: {(result.score * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-foreground leading-relaxed text-base">{result.content}</p>

                    {result.metadata && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                        {Object.entries(result.metadata).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs bg-muted/50">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <Card className="bg-card/30 border-border/50">
          <CardContent className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground text-base">
              Try adjusting your search query or check if the API server is running.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
