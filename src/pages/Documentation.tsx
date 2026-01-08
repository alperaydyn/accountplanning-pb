import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Simple markdown to HTML converter
const markdownToHtml = (markdown: string): string => {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Wrap consecutive li elements in ul
    .replace(/(<li>.*<\/li>\n?)+/gim, (match) => `<ul>${match}</ul>`)
    // Line breaks (paragraphs)
    .replace(/\n\n/gim, '</p><p>')
    // Single line breaks within paragraphs
    .replace(/\n/gim, '<br/>');

  // Wrap in paragraph tags
  html = `<p>${html}</p>`;
  
  // Clean up empty paragraphs and fix nested issues
  html = html
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-3]>)/g, '$1')
    .replace(/(<\/h[1-3]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<pre>)/g, '$1')
    .replace(/(<\/pre>)<\/p>/g, '$1')
    .replace(/<br\/><br\/>/g, '</p><p>');

  return html;
};

const Documentation = () => {
  const { t } = useLanguage();
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        const response = await fetch("/README.md");
        if (!response.ok) {
          throw new Error("Failed to fetch README.md");
        }
        const text = await response.text();
        const html = markdownToHtml(text);
        setReadmeContent(html);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load README");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadme();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageBreadcrumb items={[{ label: t.settings, href: "/settings" }, { label: t.documentation }]} />
            <h1 className="text-2xl font-bold text-foreground">{t.projectDocumentation}</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.backToSettings}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              README.md
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-destructive py-4">{error}</div>
            ) : (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-4 [&_h1]:mt-0
                  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3
                  [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2
                  [&_p]:text-muted-foreground [&_p]:mb-3 [&_p]:leading-relaxed
                  [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:text-muted-foreground
                  [&_li]:mb-1
                  [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:mb-4
                  [&_code]:text-sm [&_code]:text-foreground
                  [&_strong]:text-foreground [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: readmeContent }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Documentation;
