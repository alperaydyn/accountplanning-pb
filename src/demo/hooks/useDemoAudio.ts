import { useState, useEffect, useRef, useCallback } from "react";
import { useDemo } from "../contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export function useDemoAudio() {
  const { state, currentStep, nextStep } = useDemo();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  // Generate audio from text using ElevenLabs
  const generateAudio = useCallback(async (text: string, stepId: string): Promise<string | null> => {
    const cacheKey = `${language}-${stepId}`;
    
    // Check cache first
    if (audioCache.current.has(cacheKey)) {
      return audioCache.current.get(cacheKey)!;
    }

    try {
      const { data: { publicUrl } } = supabase.storage
        .from('demo-audio')
        .getPublicUrl(`${language}/${stepId}.mp3`);

      // Check if pre-generated audio exists in storage
      const storageResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (storageResponse.ok) {
        audioCache.current.set(cacheKey, publicUrl);
        return publicUrl;
      }
    } catch {
      // Storage file doesn't exist, generate on-the-fly
    }

    // Generate audio via edge function
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-demo-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, language, stepId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioCache.current.set(cacheKey, audioUrl);
      return audioUrl;
    } catch (err) {
      console.error('Error generating audio:', err);
      return null;
    }
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Revoke object URLs
      audioCache.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Handle step changes
  useEffect(() => {
    if (!state.isActive || !state.isPlaying || !currentStep) {
      return;
    }

    const stepContent = currentStep.content[language];
    const narrative = stepContent?.narrative;

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setAudioProgress(0);
    setError(null);

    // Generate and play audio
    const playAudio = async () => {
      if (!narrative) {
        // No narrative - use timer-based progression
        startTimerProgression();
        return;
      }

      setIsLoading(true);
      const audioUrl = await generateAudio(narrative, currentStep.id);
      setIsLoading(false);

      if (!audioUrl) {
        // Failed to generate - use timer fallback
        startTimerProgression();
        return;
      }

      const audio = new Audio(audioUrl);
      audio.volume = state.volume;
      audio.playbackRate = state.speed;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setAudioProgress(100);
        // Wait a bit then go to next step
        timerRef.current = setTimeout(() => {
          nextStep();
        }, 800);
      };

      audio.onerror = () => {
        setError("Failed to play audio");
        startTimerProgression();
      };

      audio.play().catch(() => {
        setError("Failed to play audio");
        startTimerProgression();
      });
    };

    const startTimerProgression = () => {
      const stepDuration = currentStep.duration / state.speed;
      const progressInterval = 100;
      let elapsed = 0;

      const updateProgress = () => {
        elapsed += progressInterval;
        setAudioProgress(Math.min((elapsed / stepDuration) * 100, 100));

        if (elapsed < stepDuration) {
          timerRef.current = setTimeout(updateProgress, progressInterval);
        } else {
          nextStep();
        }
      };

      timerRef.current = setTimeout(updateProgress, progressInterval);
    };

    playAudio();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    state.isActive,
    state.isPlaying,
    state.currentStepIndex,
    currentStep,
    language,
    state.volume,
    state.speed,
    nextStep,
    generateAudio,
  ]);

  // Handle pause/resume
  useEffect(() => {
    if (!audioRef.current) return;

    if (state.isPaused) {
      audioRef.current.pause();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    } else if (state.isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [state.isPaused, state.isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = state.speed;
    }
  }, [state.speed]);

  return {
    isLoading,
    error,
    audioProgress,
  };
}
