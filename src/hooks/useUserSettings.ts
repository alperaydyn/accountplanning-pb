import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Language } from '@/i18n/translations';

export type AgendaViewMode = "daily" | "weekly" | "monthly" | "list";
export type AIProvider = "lovable" | "openai" | "openrouter" | "local";

interface UserSettings {
  id: string;
  user_id: string;
  language: Language;
  theme: string;
  notifications_enabled: boolean;
  preferred_agenda_view: AgendaViewMode;
  ai_provider: AIProvider;
  ai_model: string | null;
  ai_api_key_encrypted: string | null;
  ai_base_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            language: 'tr',
            theme: 'system',
            notifications_enabled: true,
            preferred_agenda_view: 'weekly',
            ai_provider: 'lovable',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }

      return data as UserSettings;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Pick<UserSettings, 'language' | 'theme' | 'notifications_enabled' | 'preferred_agenda_view' | 'ai_provider' | 'ai_model' | 'ai_api_key_encrypted' | 'ai_base_url'>>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    updateSettingsAsync: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
  };
}
