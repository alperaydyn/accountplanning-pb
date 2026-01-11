import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Volume2,
  Settings2,
} from "lucide-react";
import { useDemo } from "../contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function DemoControls() {
  const {
    state,
    pauseDemo,
    resumeDemo,
    stopDemo,
    nextStep,
    previousStep,
    setSpeed,
    setVolume,
    progress,
  } = useDemo();
  const { t } = useLanguage();

  if (!state.isActive) {
    return null;
  }

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-card border border-border rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1">
      {/* Previous */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={previousStep}
        disabled={state.currentStepIndex === 0}
      >
        <SkipBack className="h-4 w-4" />
      </Button>

      {/* Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={state.isPaused ? resumeDemo : pauseDemo}
      >
        {state.isPaused ? (
          <Play className="h-5 w-5" />
        ) : (
          <Pause className="h-5 w-5" />
        )}
      </Button>

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={nextStep}
      >
        <SkipForward className="h-4 w-4" />
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Volume */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Volume2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-3" side="top">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Volume
            </span>
            <Slider
              value={[state.volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Speed */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded-full text-xs"
          >
            {state.speed}x
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-2" side="top">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground block mb-2">
              Speed
            </span>
            {speedOptions.map((speed) => (
              <Button
                key={speed}
                variant={state.speed === speed ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-center"
                onClick={() => setSpeed(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Exit */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
        onClick={stopDemo}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
