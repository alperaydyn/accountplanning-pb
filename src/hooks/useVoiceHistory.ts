import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VoiceHistoryEntry {
  id: string;
  user_id: string;
  voice_id: string;
  voice_name: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}

export function useVoiceHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: voiceHistory, isLoading } = useQuery({
    queryKey: ['voice-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('elevenlabs_voice_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data as VoiceHistoryEntry[];
    },
    enabled: !!user?.id,
  });

  const saveVoice = useMutation({
    mutationFn: async ({ voiceId, voiceName, setActive }: { voiceId: string; voiceName: string; setActive?: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // If setting as active, first deactivate all others
      if (setActive) {
        await supabase
          .from('elevenlabs_voice_history')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }

      // Upsert the voice entry
      const { data, error } = await supabase
        .from('elevenlabs_voice_history')
        .upsert(
          {
            user_id: user.id,
            voice_id: voiceId,
            voice_name: voiceName,
            is_active: setActive ?? false,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,voice_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as VoiceHistoryEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-history', user?.id] });
    },
  });

  const setActiveVoice = useMutation({
    mutationFn: async (voiceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Deactivate all voices
      await supabase
        .from('elevenlabs_voice_history')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate the selected voice and update last_used_at
      const { error } = await supabase
        .from('elevenlabs_voice_history')
        .update({ is_active: true, last_used_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('voice_id', voiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-history', user?.id] });
    },
  });

  const deleteVoice = useMutation({
    mutationFn: async (voiceId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('elevenlabs_voice_history')
        .delete()
        .eq('user_id', user.id)
        .eq('voice_id', voiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-history', user?.id] });
    },
  });

  const activeVoice = voiceHistory?.find(v => v.is_active);

  return {
    voiceHistory: voiceHistory ?? [],
    activeVoice,
    isLoading,
    saveVoice: saveVoice.mutate,
    saveVoiceAsync: saveVoice.mutateAsync,
    setActiveVoice: setActiveVoice.mutate,
    deleteVoice: deleteVoice.mutate,
    isSaving: saveVoice.isPending,
  };
}
