import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Play, Save, Loader2, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface SavedQuery {
  id: string;
  name: string;
  query_text: string;
  created_at: string;
}

interface QueryResult {
  data: Record<string, unknown>[];
  executionTime?: number;
}

export function QueryPanel() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [queryName, setQueryName] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch saved queries
  const { data: savedQueries = [] } = useQuery({
    queryKey: ["saved-queries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_queries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedQuery[];
    },
    enabled: !!session,
  });

  // Save query mutation
  const saveQueryMutation = useMutation({
    mutationFn: async ({ name, queryText }: { name: string; queryText: string }) => {
      const { error } = await supabase.from("saved_queries").insert({
        user_id: session!.user.id,
        name,
        query_text: queryText,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
      setQueryName("");
      toast.success("Query saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Delete query mutation
  const deleteQueryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_queries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
      toast.success("Query deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const runQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    const startTime = performance.now();

    try {
      const { data, error: fnError } = await supabase.functions.invoke("run-query", {
        body: { query },
      });

      const executionTime = Math.round(performance.now() - startTime);

      if (fnError) {
        setError(fnError.message);
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setResult({ data: data?.data || [], executionTime });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveQuery = () => {
    if (!queryName.trim()) {
      toast.error("Please enter a query name");
      return;
    }
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }
    saveQueryMutation.mutate({ name: queryName.trim(), queryText: query });
  };

  const handleLoadQuery = (queryId: string) => {
    const savedQuery = savedQueries.find((q) => q.id === queryId);
    if (savedQuery) {
      setQuery(savedQuery.query_text);
    }
  };

  const handleDeleteQuery = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    deleteQueryMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          SQL Query Runner
        </CardTitle>
        <CardDescription>
          Run SELECT queries with your authenticated user context (RLS applied)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saved Queries Dropdown */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="saved-queries" className="sr-only">
              Saved Queries
            </Label>
            <Select onValueChange={handleLoadQuery}>
              <SelectTrigger>
                <SelectValue placeholder="Load saved query..." />
              </SelectTrigger>
              <SelectContent>
                {savedQueries.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No saved queries
                  </div>
                ) : (
                  savedQueries.map((sq) => (
                    <SelectItem key={sq.id} value={sq.id} className="pr-8">
                      <div className="flex items-center justify-between w-full">
                        <span>{sq.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => handleDeleteQuery(e, sq.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Query Input */}
        <div>
          <Label htmlFor="query">SQL Query</Label>
          <Textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM customers LIMIT 10"
            className="font-mono text-sm min-h-[120px]"
          />
        </div>

        {/* Save Query */}
        <div className="flex gap-2">
          <Input
            placeholder="Query name..."
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={handleSaveQuery}
            disabled={saveQueryMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={runQuery} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-mono">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {result.data.length} rows in {result.executionTime}ms
              </span>
            </div>
            <div className="rounded-md border bg-muted/50 p-3 overflow-auto max-h-[400px]">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
