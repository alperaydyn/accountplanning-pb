import { useState, useEffect } from "react";
import { Volume2, Play, Loader2, Check, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useVoiceHistory } from "@/hooks/useVoiceHistory";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const DEFAULT_VOICE_ID = "S85IPTaQ0TGGMhJkucvb";
const DEFAULT_VOICE_NAME = "Thomas";

export function ElevenLabsSettings() {
  const { toast } = useToast();
  const { settings, updateSettingsAsync, isUpdating } = useUserSettings();
  const { voiceHistory, activeVoice, saveVoiceAsync, setActiveVoice, deleteVoice, isSaving } = useVoiceHistory();
  
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [voiceName, setVoiceName] = useState(DEFAULT_VOICE_NAME);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

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
          body: JSON.stringify({ voiceId: voiceId || DEFAULT_VOICE_ID }),
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

  const handleSelectFromHistory = async (entry: { voice_id: string; voice_name: string }) => {
    setVoiceId(entry.voice_id);
    setVoiceName(entry.voice_name);
    
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voice ID */}
          <div className="space-y-2">
            <Label>Ses ID (Voice ID)</Label>
            <Input
              placeholder="örn: S85IPTaQ0TGGMhJkucvb"
              value={voiceId}
              onChange={(e) => {
                setVoiceId(e.target.value);
                setHasUnsavedChanges(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              ElevenLabs ses kütüphanesinden alınan ses kimliği
            </p>
          </div>

          {/* Voice Name */}
          <div className="space-y-2">
            <Label>Ses Adı</Label>
            <Input
              placeholder="örn: Thomas"
              value={voiceName}
              onChange={(e) => {
                setVoiceName(e.target.value);
                setHasUnsavedChanges(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Seçilen sesin görüntülenen adı
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleTestVoice}
            disabled={isTesting || !voiceId}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Sesi Test Et
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || isSaving || !hasUnsavedChanges}
          >
            Kaydet
          </Button>
        </div>

        {/* Voice History */}
        {voiceHistory.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ses Geçmişi
            </Label>
            <div className="space-y-2">
              {voiceHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    entry.is_active ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {entry.is_active && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">{entry.voice_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.voice_id.substring(0, 12)}... • Son kullanım: {format(new Date(entry.last_used_at), 'dd.MM.yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectFromHistory(entry)}
                      >
                        Seç
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFromHistory(entry.voice_id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
