import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ClickedElementInfo } from '@/contexts/InspectorContext';

interface RAGMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feedbackId?: string;
  feedbackScore?: -1 | 1 | null;
  queryType?: 'business' | 'technical' | 'out_of_context' | 'unanswered';
}

interface UseRAGChatOptions {
  clickedElement?: ClickedElementInfo | null;
}

export function useRAGChat(options?: UseRAGChatOptions) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);

  const checkUserLimit = useCallback(async () => {
    if (!user) return { allowed: true };

    try {
      const { data: limitData, error } = await supabase
        .from('rag_user_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user limit:', error);
        return { allowed: true };
      }

      if (limitData?.blocked_until) {
        const blockedTime = new Date(limitData.blocked_until);
        if (blockedTime > new Date()) {
          setIsBlocked(true);
          setBlockedUntil(blockedTime);
          return { allowed: false, blockedUntil: blockedTime };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking user limit:', error);
      return { allowed: true };
    }
  }, [user]);

  const sendMessage = useCallback(async (question: string) => {
    if (!user || !question.trim()) return;

    // Check if user is blocked
    const limitCheck = await checkUserLimit();
    if (!limitCheck.allowed) {
      toast.error(`You are blocked until ${limitCheck.blockedUntil?.toLocaleString()}`);
      return;
    }

    const userMessage: RAGMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('rag-assistant', {
        body: {
          question,
          clickedElement: options?.clickedElement,
          currentRoute: window.location.pathname,
        },
      });

      if (error) throw error;

      const assistantMessage: RAGMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        feedbackId: data.feedbackId,
        feedbackScore: null,
        queryType: data.queryType,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle blocked state from response
      if (data.blocked) {
        setIsBlocked(true);
        setBlockedUntil(new Date(data.blockedUntil));
        toast.error(`Too many out-of-context queries. Blocked until ${new Date(data.blockedUntil).toLocaleString()}`);
      }

      // Handle warning about remaining rights
      if (data.remainingRights !== undefined && data.remainingRights <= 2) {
        toast.warning(`Out of context warning: ${data.remainingRights} attempts remaining before 24h block`);
      }

    } catch (error) {
      console.error('RAG chat error:', error);
      
      const errorMessage: RAGMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        queryType: 'unanswered',
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get answer');
    } finally {
      setIsLoading(false);
    }
  }, [user, options?.clickedElement, checkUserLimit]);

  const submitFeedback = useCallback(async (messageId: string, score: -1 | 1) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.feedbackId) return;

    try {
      const { error } = await supabase
        .from('rag_feedback')
        .update({ feedback_score: score })
        .eq('id', message.feedbackId);

      if (error) throw error;

      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? { ...m, feedbackScore: score }
            : m
        )
      );

      toast.success(score === 1 ? 'Thanks for the positive feedback!' : 'Thanks, we\'ll improve this answer');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    isBlocked,
    blockedUntil,
    sendMessage,
    submitFeedback,
    clearMessages,
  };
}
