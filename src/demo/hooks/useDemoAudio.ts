import { useState, useEffect, useRef, useCallback } from "react";
import { useDemo } from "../contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";

// Global request tracking to prevent duplicate calls
const pendingRequests = new Map<string, Promise<string | null>>();

export function useDemoAudio() {
  const { state, currentStep, nextStep } = useDemo();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());
  const isMountedRef = useRef(true);
  const currentRequestId = useRef<string | null>(null);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Generate audio from text using ElevenLabs with deduplication
  const generateAudio = useCallback(async (text: string, stepId: string): Promise<string | null> => {
    const cacheKey = `${language}-${stepId}`;
    
    // Check cache first
    if (audioCache.current.has(cacheKey)) {
      return audioCache.current.get(cacheKey)!;
    }

    // Check if request is already in progress
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    // Create new request promise
    const requestPromise = (async (): Promise<string | null> => {
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
          const errorText = await response.text();
          console.error('Audio generation failed:', errorText);
          return null;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioCache.current.set(cacheKey, audioUrl);
        return audioUrl;
      } catch (err) {
        console.error('Error generating audio:', err);
        return null;
      } finally {
        // Clean up pending request
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, [language]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Revoke object URLs
      audioCache.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [cleanup]);

  // Timer-based progression fallback
  const startTimerProgression = useCallback((duration: number, speed: number) => {
    const stepDuration = duration / speed;
    const progressInterval = 100;
    let elapsed = 0;

    const updateProgress = () => {
      if (!isMountedRef.current) return;
      
      elapsed += progressInterval;
      setAudioProgress(Math.min((elapsed / stepDuration) * 100, 100));

      if (elapsed < stepDuration) {
        timerRef.current = setTimeout(updateProgress, progressInterval);
      } else {
        nextStep();
      }
    };

    timerRef.current = setTimeout(updateProgress, progressInterval);
  }, [nextStep]);

  // Handle step changes - debounced with request ID tracking
  useEffect(() => {
    if (!state.isActive || !state.isPlaying || !currentStep) {
      return;
    }

    let cancelled = false;

    const stepContent = currentStep.content[language];
    const narrative = stepContent?.narrative;
    const requestId = `${language}-${currentStep.id}-${Date.now()}`;
    currentRequestId.current = requestId;

    // Cleanup previous
    cleanup();
    setAudioProgress(0);
    setError(null);

    const run = async () => {
      try {
        // Check if this request is still current
        if (
          cancelled ||
          currentRequestId.current !== requestId ||
          !isMountedRef.current
        ) {
          return;
        }

        if (!narrative) {
          startTimerProgression(currentStep.duration, state.speed);
          return;
        }

        setIsLoading(true);

        const audioUrl = await generateAudio(narrative, currentStep.id);

        if (
          cancelled ||
          currentRequestId.current !== requestId ||
          !isMountedRef.current
        ) {
          return;
        }

        setIsLoading(false);

        if (!audioUrl) {
          startTimerProgression(currentStep.duration, state.speed);
          return;
        }

        const audio = new Audio(audioUrl);
        audio.volume = state.volume;
        audio.playbackRate = state.speed;
        audioRef.current = audio;

        audio.ontimeupdate = () => {
          if (cancelled || !isMountedRef.current) return;
          if (audio.duration) {
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onended = () => {
          if (cancelled || !isMountedRef.current) return;
          setAudioProgress(100);
          timerRef.current = setTimeout(() => {
            if (!cancelled && isMountedRef.current) {
              nextStep();
            }
          }, 800);
        };

        audio.onerror = () => {
          if (cancelled || !isMountedRef.current) return;
          setError("Failed to play audio");
          startTimerProgression(currentStep.duration, state.speed);
        };

        audio.play().catch(() => {
          if (cancelled || !isMountedRef.current) return;
          startTimerProgression(currentStep.duration, state.speed);
        });
      } catch (err) {
        // IMPORTANT: never let async errors escape (prevents UNHANDLED_PROMISE_REJECTION)
        console.error("Demo audio run() failed:", err);
        if (cancelled || !isMountedRef.current) return;
        setIsLoading(false);
        startTimerProgression(currentStep.duration, state.speed);
      }
    };

    // 100ms debounce, but do NOT use async directly inside setTimeout
    const debounceTimer = setTimeout(() => {
      void run();
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
      cleanup();
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
    cleanup,
    startTimerProgression,
  ]);

  // Handle pause/resume
  useEffect(() => {
    if (!audioRef.current) return;

    if (state.isPaused) {
      audioRef.current.pause();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
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
