import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";

const DEFAULT_VOICE_ID = "S85IPTaQ0TGGMhJkucvb";
const DEFAULT_VOICE_NAME = "Thomas";

export function ElevenLabsSettings() {
  const { toast } = useToast();
  const { settings, updateSettingsAsync, isUpdating } = useUserSettings();
  
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [voiceName, setVoiceName] = useState(DEFAULT_VOICE_NAME);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings
  useEffect(() => {
    if (settings) {
      setVoiceId((settings as any).elevenlabs_voice_id || DEFAULT_VOICE_ID);
      setVoiceName((settings as any).elevenlabs_voice_name || DEFAULT_VOICE_NAME);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettingsAsync({
        elevenlabs_voice_id: voiceId || DEFAULT_VOICE_ID,
        elevenlabs_voice_name: voiceName || DEFAULT_VOICE_NAME,
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
            onClick={handleSave}
            disabled={isUpdating || !hasUnsavedChanges}
          >
            Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
