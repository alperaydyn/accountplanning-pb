import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  customer_mapping: Record<string, string> | null;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  portfolio_manager_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useAIChatSessions = () => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['ai-chat-sessions', portfolioManager?.id],
    queryFn: async (): Promise<ChatSession[]> => {
      if (!portfolioManager) return [];

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('portfolio_manager_id', portfolioManager.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!portfolioManager,
  });
};

export const useAIChatMessages = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['ai-chat-messages', sessionId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        customer_mapping: msg.customer_mapping as Record<string, string> | null,
        usage: msg.usage as { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null,
      }));
    },
    enabled: !!sessionId,
  });
};

export const useCreateChatSession = () => {
  const queryClient = useQueryClient();
  const { data: portfolioManager } = usePortfolioManager();

  return useMutation({
    mutationFn: async (title?: string): Promise<ChatSession> => {
      if (!portfolioManager) throw new Error('No portfolio manager');

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          portfolio_manager_id: portfolioManager.id,
          title: title || 'Yeni Sohbet',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });
};

export const useUpdateChatSessionTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({ title })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });
};

export const useDeleteChatSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });
};

export const useAddChatMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      role,
      content,
      customerMapping,
      usage,
      provider,
      modelName,
    }: {
      sessionId: string;
      role: 'user' | 'assistant';
      content: string;
      customerMapping?: Record<string, string>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      provider?: string;
      modelName?: string;
    }) => {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          customer_mapping: customerMapping || null,
          usage: usage || null,
          provider: provider || null,
          model_name: modelName || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update session's updated_at
      await supabase
        .from('ai_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });
};
