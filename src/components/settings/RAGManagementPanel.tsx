import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Database, MessageSquare, ThumbsDown, AlertTriangle, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";

interface RAGChunk {
  id: string;
  chunk_id: string;
  category: string;
  title: string;
  business_description: string | null;
  technical_description: string | null;
  route: string | null;
  is_active: boolean;
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

export function RAGManagementPanel() {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [newChunk, setNewChunk] = useState({ chunk_id: "", title: "", category: "General", business_description: "", technical_description: "" });

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

  const addChunkMutation = useMutation({
    mutationFn: async (chunk: typeof newChunk) => {
      const { error } = await supabase.from("rag_chunks").insert(chunk);
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
      const { error } = await supabase.from("rag_feedback").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", feedbackId);
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
  const negativeFeedback = feedback?.filter(f => f.feedback_score === -1 && !f.resolved) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          RAG Documentation Management
        </CardTitle>
        <CardDescription>Manage help documentation chunks and review user feedback</CardDescription>
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

          <TabsContent value="chunks" className="mt-4">
            <ScrollArea className="h-[400px]">
              {chunksLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="space-y-2">
                  {chunks?.map(chunk => (
                    <div key={chunk.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{chunk.category}</Badge>
                          <span className="font-medium">{chunk.title}</span>
                        </div>
                        <Badge variant={chunk.is_active ? "default" : "secondary"}>{chunk.is_active ? "Active" : "Inactive"}</Badge>
                      </div>
                      {chunk.route && <p className="text-xs text-muted-foreground mt-1">Route: {chunk.route}</p>}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
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
  );
}
