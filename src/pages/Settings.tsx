import { Link } from "react-router-dom";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Globe, FileText, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

const Settings = () => {
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <PageBreadcrumb items={[{ label: t.nav.settings }]} />
          <h1 className="text-2xl font-bold text-foreground">{t.settings.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.settings.description}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t.settings.language}
              </CardTitle>
              <CardDescription>{t.settings.languageDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label htmlFor="language-select" className="sr-only">{t.settings.language}</Label>
                <LanguageSelector />
              </div>
            </CardContent>
          </Card>

          {/* Documentation Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t.settings.documentation}
              </CardTitle>
              <CardDescription>{t.settings.documentationDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/documentation">
                  {t.settings.viewDocumentation}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
