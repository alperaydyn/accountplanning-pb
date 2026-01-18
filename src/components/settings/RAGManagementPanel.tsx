import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Database, MessageSquare, ThumbsDown, AlertTriangle, Plus, Loader2, CheckCircle, Search } from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RAGChunk {
  id: string;
  chunk_id: string;
  category: string;
  title: string;
  business_description: string | null;
  technical_description: string | null;
  route: string | null;
  is_active: boolean;
  keywords: string[] | null;
  related_files: string[] | null;
  audience: string[] | null;
  metadata: any;
}

interface RAGFeedback {
  id: string;
  question: string;
  answer: string;
  feedback_score: number | null;
  query_type: string | null;
  needs_investigation: boolean;
  resolved: boolean;
  created_at: string;
}

const CHUNKS_PER_PAGE = 10;

export function RAGManagementPanel() {
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newChunk, setNewChunk] = useState({ chunk_id: "", title: "", category: "General", business_description: "", technical_description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChunk, setSelectedChunk] = useState<RAGChunk | null>(null);

  const importBuiltInDocsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/rag-documentation.json", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch rag-documentation.json (HTTP ${res.status})`);
      }

      const json = (await res.json()) as { chunks?: unknown[] };
      const rawChunks = Array.isArray(json.chunks) ? json.chunks : [];

      if (rawChunks.length === 0) {
        throw new Error("rag-documentation.json did not contain any chunks");
      }

      const mapped = rawChunks.map((c: any) => ({
        chunk_id: String(c.id),
        category: String(c.category ?? "General"),
        audience: Array.isArray(c.audience) ? c.audience.map(String) : ["business", "technical"],
        title: String(c.title ?? c.id),
        business_description: c.business_description ?? null,
        technical_description: c.technical_description ?? null,
        route: c.route ?? null,
        related_files: Array.isArray(c.related_files) ? c.related_files.map(String) : null,
        keywords: Array.isArray(c.keywords) ? c.keywords.map(String) : null,
        metadata: c,
        is_active: true,
        created_by: user?.id ?? null,
      }));

      const batchSize = 50;
      for (let i = 0; i < mapped.length; i += batchSize) {
        const batch = mapped.slice(i, i + batchSize);
        const { error } = await supabase
          .from("rag_chunks")
          .upsert(batch as any, { onConflict: "chunk_id" });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Imported RAG documentation successfully");
      queryClient.invalidateQueries({ queryKey: ["rag-chunks"] });
    },
    onError: (error) => toast.error(`Import failed: ${error.message}`),
  });

  const { data: chunks, isLoading: chunksLoading } = useQuery({
    queryKey: ["rag-chunks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rag_chunks").select("*").order("category");
      if (error) throw error;
      return data as RAGChunk[];
    },
    enabled: isAdmin,
  });

  const { data: feedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ["rag-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rag_feedback").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as RAGFeedback[];
    },
    enabled: isAdmin,
  });

  const filteredChunks = useMemo(() => {
    if (!chunks) return [];
    if (!searchQuery.trim()) return chunks;
    
    const query = searchQuery.toLowerCase();
    return chunks.filter(chunk => 
      chunk.title.toLowerCase().includes(query) ||
      chunk.chunk_id.toLowerCase().includes(query) ||
      chunk.category.toLowerCase().includes(query) ||
      chunk.business_description?.toLowerCase().includes(query) ||
      chunk.technical_description?.toLowerCase().includes(query) ||
      chunk.route?.toLowerCase().includes(query) ||
      chunk.keywords?.some(k => k.toLowerCase().includes(query))
    );
  }, [chunks, searchQuery]);

  const totalPages = Math.ceil(filteredChunks.length / CHUNKS_PER_PAGE);
  const paginatedChunks = useMemo(() => {
    const start = (currentPage - 1) * CHUNKS_PER_PAGE;
    return filteredChunks.slice(start, start + CHUNKS_PER_PAGE);
  }, [filteredChunks, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const addChunkMutation = useMutation({
    mutationFn: async (chunk: typeof newChunk) => {
      const { error } = await supabase.from("rag_chunks").insert({
        ...chunk,
        created_by: user?.id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chunk added successfully");
      queryClient.invalidateQueries({ queryKey: ["rag-chunks"] });
      setNewChunk({ chunk_id: "", title: "", category: "General", business_description: "", technical_description: "" });
    },
    onError: (error) => toast.error(`Failed to add chunk: ${error.message}`),
  });

  const resolveFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from("rag_feedback")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as resolved");
      queryClient.invalidateQueries({ queryKey: ["rag-feedback"] });
    },
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Admin access required to manage RAG documentation.
        </CardContent>
      </Card>
    );
  }

  const needsReview = feedback?.filter(f => f.needs_investigation && !f.resolved) || [];

  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return null;
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                RAG Documentation Management
              </CardTitle>
              <CardDescription>Manage help documentation chunks and review user feedback</CardDescription>
            </div>
            <Button 
              onClick={() => importBuiltInDocsMutation.mutate()} 
              disabled={importBuiltInDocsMutation.isPending}
              variant="outline"
            >
              {importBuiltInDocsMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Import built-in docs</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chunks">
            <TabsList>
              <TabsTrigger value="chunks">Chunks ({chunks?.length || 0})</TabsTrigger>
              <TabsTrigger value="review" className="relative">
                Needs Review
                {needsReview.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center">{needsReview.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="add">Add Chunk</TabsTrigger>
            </TabsList>

            <TabsContent value="chunks" className="mt-4 space-y-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chunks by title, category, description, route, keywords..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[350px]">
                {chunksLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : paginatedChunks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No chunks match your search" : "No chunks found"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {paginatedChunks.map(chunk => (
                      <div 
                        key={chunk.id} 
                        className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setSelectedChunk(chunk)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{chunk.category}</Badge>
                            <span className="font-medium">{chunk.title}</span>
                          </div>
                          <Badge variant={chunk.is_active ? "default" : "secondary"}>{chunk.is_active ? "Active" : "Inactive"}</Badge>
                        </div>
                        {chunk.route && <p className="text-xs text-muted-foreground mt-1">Route: {chunk.route}</p>}
                        {chunk.business_description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {truncateText(chunk.business_description)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Showing {paginatedChunks.length} of {filteredChunks.length} chunks
                {searchQuery && ` (filtered from ${chunks?.length || 0} total)`}
              </p>
            </TabsContent>

            <TabsContent value="review" className="mt-4">
              <ScrollArea className="h-[400px]">
                {needsReview.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No items need review</p>
                ) : (
                  <div className="space-y-3">
                    {needsReview.map(item => (
                      <div key={item.id} className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <span className="font-medium text-sm">Unanswered Question</span>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => resolveFeedbackMutation.mutate(item.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                          </Button>
                        </div>
                        <p className="text-sm mt-2 font-medium">{item.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="feedback" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {feedback?.slice(0, 20).map(item => (
                    <div key={item.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        {item.feedback_score === 1 ? <ThumbsDown className="h-3 w-3 text-success rotate-180" /> : 
                         item.feedback_score === -1 ? <ThumbsDown className="h-3 w-3 text-destructive" /> : 
                         <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                        <span className="truncate flex-1">{item.question}</span>
                        <Badge variant="outline" className="text-xs">{item.query_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="add" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Chunk ID</Label><Input value={newChunk.chunk_id} onChange={e => setNewChunk(p => ({ ...p, chunk_id: e.target.value }))} placeholder="unique_chunk_id" /></div>
                <div><Label>Category</Label><Input value={newChunk.category} onChange={e => setNewChunk(p => ({ ...p, category: e.target.value }))} /></div>
              </div>
              <div><Label>Title</Label><Input value={newChunk.title} onChange={e => setNewChunk(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Business Description</Label><Textarea value={newChunk.business_description} onChange={e => setNewChunk(p => ({ ...p, business_description: e.target.value }))} rows={3} /></div>
              <div><Label>Technical Description</Label><Textarea value={newChunk.technical_description} onChange={e => setNewChunk(p => ({ ...p, technical_description: e.target.value }))} rows={3} /></div>
              <Button onClick={() => addChunkMutation.mutate(newChunk)} disabled={!newChunk.chunk_id || !newChunk.title}>
                <Plus className="h-4 w-4 mr-2" /> Add Chunk
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chunk Detail Dialog */}
      <Dialog open={!!selectedChunk} onOpenChange={(open) => !open && setSelectedChunk(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">{selectedChunk?.category}</Badge>
              {selectedChunk?.title}
            </DialogTitle>
            <DialogDescription>
              Chunk ID: {selectedChunk?.chunk_id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedChunk && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedChunk.is_active ? "default" : "secondary"}>
                  {selectedChunk.is_active ? "Active" : "Inactive"}
                </Badge>
                {selectedChunk.route && (
                  <Badge variant="outline">Route: {selectedChunk.route}</Badge>
                )}
              </div>

              {selectedChunk.audience && selectedChunk.audience.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Audience</Label>
                  <div className="flex gap-1 mt-1">
                    {selectedChunk.audience.map(a => (
                      <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedChunk.business_description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Business Description</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">
                    {selectedChunk.business_description}
                  </p>
                </div>
              )}

              {selectedChunk.technical_description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Technical Description</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg whitespace-pre-wrap font-mono text-xs">
                    {selectedChunk.technical_description}
                  </p>
                </div>
              )}

              {selectedChunk.keywords && selectedChunk.keywords.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Keywords</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedChunk.keywords.map(k => (
                      <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedChunk.related_files && selectedChunk.related_files.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Related Files</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedChunk.related_files.map(f => (
                      <Badge key={f} variant="secondary" className="text-xs font-mono">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
