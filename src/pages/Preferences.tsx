import { Link } from "react-router-dom";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Globe, FileText, ExternalLink, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useUserSettings, AgendaViewMode } from "@/hooks/useUserSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PriorityWeightsPanel from "@/components/preferences/PriorityWeightsPanel";

const Preferences = () => {
  const { t } = useLanguage();
  const { settings, updateSettings, isUpdating } = useUserSettings();

  const handleAgendaViewChange = (value: AgendaViewMode) => {
    updateSettings({ preferred_agenda_view: value });
  };

  const viewModeLabels: Record<AgendaViewMode, string> = {
    daily: t.actions.daily,
    weekly: t.actions.weekly,
    monthly: t.actions.monthly,
    list: t.actions.list,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <PageBreadcrumb items={[{ label: t.nav.preferences }]} />
          <h1 className="text-2xl font-bold text-foreground">{t.preferences.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.preferences.description}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Priority Weights Panel - at the top */}
          <PriorityWeightsPanel />

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

          {/* Preferred Agenda View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t.actions.preferredView}
              </CardTitle>
              <CardDescription>{t.actions.preferredViewDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Select 
                  value={settings?.preferred_agenda_view || "weekly"} 
                  onValueChange={handleAgendaViewChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{viewModeLabels.daily}</SelectItem>
                    <SelectItem value="weekly">{viewModeLabels.weekly}</SelectItem>
                    <SelectItem value="monthly">{viewModeLabels.monthly}</SelectItem>
                    <SelectItem value="list">{viewModeLabels.list}</SelectItem>
                  </SelectContent>
                </Select>
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

export default Preferences;
