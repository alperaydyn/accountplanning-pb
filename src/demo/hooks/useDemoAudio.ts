import { useState, useEffect, useRef, useCallback } from "react";
import { useDemo } from "../contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function useDemoAudio() {
  const { state, currentStep, nextStep } = useDemo();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    };
  }, []);

  // Handle step changes
  useEffect(() => {
    if (!state.isActive || !state.isPlaying || !currentStep) {
      return;
    }

    const stepContent = currentStep.content[language];
    const audioUrl = stepContent?.audioUrl;

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

    if (audioUrl) {
      // Play audio file
      setIsLoading(true);
      const audio = new Audio(audioUrl);
      audio.volume = state.volume;
      audio.playbackRate = state.speed;
      audioRef.current = audio;

      audio.onloadeddata = () => {
        setIsLoading(false);
      };

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
        }, 1000);
      };

      audio.onerror = () => {
        setIsLoading(false);
        setError("Failed to load audio");
        // Fallback to timer-based progression
        timerRef.current = setTimeout(() => {
          nextStep();
        }, currentStep.duration / state.speed);
      };

      audio.play().catch(() => {
        setError("Failed to play audio");
        // Fallback to timer-based progression
        timerRef.current = setTimeout(() => {
          nextStep();
        }, currentStep.duration / state.speed);
      });
    } else {
      // No audio - use timer-based progression
      const stepDuration = currentStep.duration / state.speed;
      const progressInterval = 100; // Update progress every 100ms
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
    }

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
