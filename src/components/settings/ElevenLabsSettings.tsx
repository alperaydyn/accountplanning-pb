import { useState, useEffect } from "react";
import { Volume2, Play, Loader2, Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useVoiceHistory } from "@/hooks/useVoiceHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_VOICE_ID = "S85IPTaQ0TGGMhJkucvb";
const DEFAULT_VOICE_NAME = "Thomas";

export function ElevenLabsSettings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { settings, updateSettingsAsync, isUpdating } = useUserSettings();
  const { voiceHistory, activeVoice, saveVoiceAsync, setActiveVoice, deleteVoice, isSaving } = useVoiceHistory();
  
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [voiceName, setVoiceName] = useState(DEFAULT_VOICE_NAME);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedHistoryVoice, setSelectedHistoryVoice] = useState<string>("");

  // Load settings
  useEffect(() => {
    if (settings) {
      setVoiceId(settings.elevenlabs_voice_id || DEFAULT_VOICE_ID);
      setVoiceName(settings.elevenlabs_voice_name || DEFAULT_VOICE_NAME);
    }
  }, [settings]);

  // Sync with active voice from history
  useEffect(() => {
    if (activeVoice) {
      setVoiceId(activeVoice.voice_id);
      setVoiceName(activeVoice.voice_name);
      setSelectedHistoryVoice(activeVoice.voice_id);
    }
  }, [activeVoice]);

  const handleTestVoice = async () => {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }

    setIsTesting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-elevenlabs-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ voiceId: voiceId || DEFAULT_VOICE_ID, language }),
        }
      );

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Play the audio using data URI
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setCurrentAudio(null);
      };
      
      await audio.play();

      toast({
        title: "Ses Testi",
        description: "Seçilen ses başarıyla çalındı.",
      });
    } catch (error) {
      console.error('Test voice error:', error);
      toast({
        title: "Hata",
        description: "Ses testi yapılamadı. Lütfen Voice ID'yi kontrol edin.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update user settings
      await updateSettingsAsync({
        elevenlabs_voice_id: voiceId || DEFAULT_VOICE_ID,
        elevenlabs_voice_name: voiceName || DEFAULT_VOICE_NAME,
      });

      // Save to voice history with active flag
      await saveVoiceAsync({
        voiceId: voiceId || DEFAULT_VOICE_ID,
        voiceName: voiceName || DEFAULT_VOICE_NAME,
        setActive: true,
      });

      toast({
        title: "Ayarlar Kaydedildi",
        description: "ElevenLabs ses ayarlarınız güncellendi.",
      });
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save settings error:', error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleSetActiveFromDropdown = async () => {
    if (!selectedHistoryVoice) return;
    
    const entry = voiceHistory.find(v => v.voice_id === selectedHistoryVoice);
    if (!entry) return;

    try {
      // Update user settings
      await updateSettingsAsync({
        elevenlabs_voice_id: entry.voice_id,
        elevenlabs_voice_name: entry.voice_name,
      });

      // Set as active in history
      setActiveVoice(entry.voice_id);

      toast({
        title: "Ses Seçildi",
        description: `${entry.voice_name} aktif ses olarak ayarlandı.`,
      });
    } catch (error) {
      console.error('Select voice error:', error);
    }
  };

  const handleDeleteFromHistory = (voiceIdToDelete: string) => {
    deleteVoice(voiceIdToDelete);
    if (selectedHistoryVoice === voiceIdToDelete) {
      setSelectedHistoryVoice("");
    }
    toast({
      title: "Ses Silindi",
      description: "Ses geçmişten kaldırıldı.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          ElevenLabs Ses Ayarları
        </CardTitle>
        <CardDescription>
          Demo ve sesli asistan için kullanılacak ses ayarları
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice ID, Name, Test and Save in one row */}
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Ses ID</Label>
            <Input
              placeholder="örn: S85IPTaQ0TGGMhJkucvb"
              value={voiceId}
              onChange={(e) => {
                setVoiceId(e.target.value);
                setHasUnsavedChanges(true);
              }}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label>Ses Adı</Label>
            <Input
              placeholder="örn: Thomas"
              value={voiceName}
              onChange={(e) => {
                setVoiceName(e.target.value);
                setHasUnsavedChanges(true);
              }}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleTestVoice}
            disabled={isTesting || !voiceId}
            className="shrink-0"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || isSaving || !hasUnsavedChanges}
            className="shrink-0"
          >
            Kaydet
          </Button>
        </div>

        {/* Saved Voices Dropdown */}
        {voiceHistory.length > 0 && (
          <div className="flex flex-col md:flex-row gap-3 items-end pt-4 border-t">
            <div className="flex-1 space-y-1.5">
              <Label>Kayıtlı Sesler</Label>
              <Select value={selectedHistoryVoice} onValueChange={setSelectedHistoryVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Ses seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {voiceHistory.map((entry) => (
                    <SelectItem key={entry.id} value={entry.voice_id}>
                      <div className="flex items-center gap-2">
                        {entry.is_active && <Check className="h-3 w-3 text-primary" />}
                        <span>{entry.voice_name}</span>
                        <span className="text-muted-foreground text-xs">
                          • {format(new Date(entry.last_used_at), 'dd.MM.yy HH:mm')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleSetActiveFromDropdown}
              disabled={!selectedHistoryVoice || voiceHistory.find(v => v.voice_id === selectedHistoryVoice)?.is_active}
              className="shrink-0"
            >
              <Check className="h-4 w-4 mr-2" />
              Aktif Yap
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectedHistoryVoice && handleDeleteFromHistory(selectedHistoryVoice)}
              disabled={!selectedHistoryVoice}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}