import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCommit, Clock, Info } from "lucide-react";

// Declare global types for build-time constants
declare global {
  const __APP_VERSION__: string;
  const __BUILD_TIME__: string;
  const __COMMIT_HASH__: string;
  const __COMMIT_TIME__: string;
  const __COMMIT_MESSAGE__: string;
}

export const VersionInfo = () => {
  const formatDate = (dateString: string) => {
    if (dateString === "unknown") return dateString;
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Version Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Version</p>
            <p className="font-mono text-sm font-medium">
              {__APP_VERSION__}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Build Time</p>
            <p className="font-mono text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(__BUILD_TIME__)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Commit</p>
            <p className="font-mono text-sm font-medium flex items-center gap-1">
              <GitCommit className="h-3 w-3" />
              {__COMMIT_HASH__}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Commit Time</p>
            <p className="font-mono text-sm font-medium">
              {formatDate(__COMMIT_TIME__)}
            </p>
          </div>
        </div>
        
        <div className="space-y-1 border-t pt-4">
          <p className="text-sm text-muted-foreground">Last Commit</p>
          <p className="text-sm font-medium">
            {__COMMIT_MESSAGE__}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
