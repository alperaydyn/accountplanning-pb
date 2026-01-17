import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { QueryPanel } from "@/components/settings/QueryPanel";
import { AIProviderSettings } from "@/components/settings/AIProviderSettings";
import { ElevenLabsSettings } from "@/components/settings/ElevenLabsSettings";
import { VersionInfo } from "@/components/settings/VersionInfo";
import { PromptManagementPanel } from "@/components/settings/PromptManagementPanel";
import { useUserRole } from "@/hooks/useUserRole";

const Settings = () => {
  const { t } = useLanguage();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

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
          {/* Version Information */}
          <VersionInfo />

          {/* AI Provider Settings */}
          <AIProviderSettings />

          {/* ElevenLabs Voice Settings */}
          <ElevenLabsSettings />

          {/* Prompt Management - Admin only */}
          {isAdmin && <PromptManagementPanel />}

          {/* SQL Query Runner */}
          <QueryPanel />
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
