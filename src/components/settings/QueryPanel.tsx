import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Database, Play, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QueryResult {
  data: unknown[] | null;
  error: string | null;
  rowCount: number;
  executionTime: number;
}

const EXAMPLE_QUERIES = [
  { label: "auth.uid()", query: "SELECT auth.uid() as current_user_id" },
  { label: "Portfolio Manager ID", query: "SELECT public.get_portfolio_manager_id(auth.uid()) as portfolio_manager_id" },
  { label: "My Customers (5)", query: "SELECT id, name, segment, sector FROM customers LIMIT 5" },
  { label: "Full Auth Check", query: "SELECT auth.uid() as user_id, public.get_portfolio_manager_id(auth.uid()) as pm_id" },
];

export function QueryPanel() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runQuery = async () => {
    if (!query.trim() || !session?.access_token) return;

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await supabase.functions.invoke("run-query", {
        body: { query: query.trim() },
      });

      const executionTime = performance.now() - startTime;

      if (response.error) {
        setResult({
          data: null,
          error: response.error.message || "Unknown error",
          rowCount: 0,
          executionTime,
        });
      } else if (response.data?.error) {
        setResult({
          data: null,
          error: response.data.error,
          rowCount: 0,
          executionTime,
        });
      } else {
        const data = response.data?.data || [];
        setResult({
          data,
          error: null,
          rowCount: Array.isArray(data) ? data.length : 0,
          executionTime,
        });
      }
    } catch (err) {
      const executionTime = performance.now() - startTime;
      setResult({
        data: null,
        error: err instanceof Error ? err.message : "Failed to execute query",
        rowCount: 0,
        executionTime,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t.settings.queryRunner}
        </CardTitle>
        <CardDescription>{t.settings.queryRunnerDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Example Queries */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t.settings.exampleQueries}</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <Button
                key={example.label}
                variant="outline"
                size="sm"
                onClick={() => handleExampleClick(example.query)}
              >
                {example.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.settings.queryPlaceholder}
            className="font-mono text-sm min-h-[120px]"
          />
          <Button
            onClick={runQuery}
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? t.common.loading : t.settings.runQuery}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {result.error ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t.settings.queryError}
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {result.rowCount} {t.settings.rowsReturned}
                </Badge>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t.settings.executionTime}: {result.executionTime.toFixed(0)}ms
              </span>
            </div>

            <div className="bg-muted rounded-md p-4 overflow-auto max-h-[400px]">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {result.error
                  ? result.error
                  : JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
