import { useState, useEffect } from "react";
import { Volume2, Play, Loader2, Check, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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

// Popular ElevenLabs voice presets
const VOICE_PRESETS = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill" },
];

// ElevenLabs model options
const ELEVENLABS_MODELS = [
  { id: "eleven_multilingual_v2", name: "Multilingual v2 (Önerilen)" },
  { id: "eleven_turbo_v2_5", name: "Turbo v2.5 (Hızlı)" },
  { id: "eleven_turbo_v2", name: "Turbo v2" },
  { id: "eleven_multilingual_v1", name: "Multilingual v1" },
  { id: "eleven_monolingual_v1", name: "English v1" },
];

const DEFAULT_MODEL = "eleven_multilingual_v2";

// Default voice settings matching edge function
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.0,
  similarity_boost: 1.0,
  style: 0.0,
  use_speaker_boost: false,
  speed: 1.1,
};

const ADD_NEW_VALUE = "__add_new__";

export function ElevenLabsSettings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { settings, updateSettingsAsync, isUpdating } = useUserSettings();
  const { voiceHistory, activeVoice, saveVoiceAsync, setActiveVoice, deleteVoice, isSaving } = useVoiceHistory();
  
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [voiceName, setVoiceName] = useState(DEFAULT_VOICE_NAME);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingHistory, setIsTestingHistory] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedHistoryVoice, setSelectedHistoryVoice] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState(DEFAULT_VOICE_SETTINGS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);

  // Load settings
  useEffect(() => {
    if (settings) {
      setVoiceId(settings.elevenlabs_voice_id || DEFAULT_VOICE_ID);
      setVoiceName(settings.elevenlabs_voice_name || DEFAULT_VOICE_NAME);
      
      // Load voice settings from database
      setVoiceSettings({
        stability: settings.elevenlabs_stability ?? DEFAULT_VOICE_SETTINGS.stability,
        similarity_boost: settings.elevenlabs_similarity_boost ?? DEFAULT_VOICE_SETTINGS.similarity_boost,
        style: settings.elevenlabs_style ?? DEFAULT_VOICE_SETTINGS.style,
        use_speaker_boost: settings.elevenlabs_speaker_boost ?? DEFAULT_VOICE_SETTINGS.use_speaker_boost,
        speed: settings.elevenlabs_speed ?? DEFAULT_VOICE_SETTINGS.speed,
      });
      
      // Load model from database
      setSelectedModel(settings.elevenlabs_model || DEFAULT_MODEL);
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

  const handleTestVoice = async (testVoiceId?: string, setTestingState?: (v: boolean) => void) => {
    const idToTest = testVoiceId || voiceId || DEFAULT_VOICE_ID;
    const setTesting = setTestingState || setIsTesting;
    
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }

    setTesting(true);
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
          body: JSON.stringify({ 
            voiceId: idToTest, 
            language,
            voiceSettings,
            model: selectedModel,
          }),
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
      setTesting(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!voiceId || !voiceName) return;
    
    try {
      // Save to voice history with active flag
      await saveVoiceAsync({
        voiceId: voiceId,
        voiceName: voiceName,
        setActive: true,
      });

      // Update user settings
      await updateSettingsAsync({
        elevenlabs_voice_id: voiceId,
        elevenlabs_voice_name: voiceName,
      });

      toast({
        title: "Ses Kaydedildi",
        description: `${voiceName} kayıtlı seslere eklendi.`,
      });
      
      // Reset add new mode
      setIsAddingNew(false);
      setSelectedPreset("");
    } catch (error) {
      console.error('Save settings error:', error);
      toast({
        title: "Hata",
        description: "Ses kaydedilemedi.",
        variant: "destructive",
      });
    }
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    
    if (value === ADD_NEW_VALUE) {
      setIsAddingNew(true);
      setVoiceId("");
      setVoiceName("");
    } else if (value) {
      setIsAddingNew(false);
      const preset = VOICE_PRESETS.find(v => v.id === value);
      if (preset) {
        setVoiceId(preset.id);
        setVoiceName(preset.name);
      }
    } else {
      setIsAddingNew(false);
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

  const handleSaveVoiceSettings = async () => {
    try {
      await updateSettingsAsync({
        elevenlabs_stability: voiceSettings.stability,
        elevenlabs_similarity_boost: voiceSettings.similarity_boost,
        elevenlabs_style: voiceSettings.style,
        elevenlabs_speed: voiceSettings.speed,
        elevenlabs_speaker_boost: voiceSettings.use_speaker_boost,
        elevenlabs_model: selectedModel,
      });

      toast({
        title: "Ses Ayarları Kaydedildi",
        description: "Ses ayarları başarıyla güncellendi.",
      });
    } catch (error) {
      console.error('Save voice settings error:', error);
      toast({
        title: "Hata",
        description: "Ses ayarları kaydedilemedi.",
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
        {/* Saved Voices Dropdown - Always visible */}
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Kayıtlı Sesler</Label>
            <Select value={selectedHistoryVoice} onValueChange={setSelectedHistoryVoice}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Ses seçin..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
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
            onClick={() => handleTestVoice(selectedHistoryVoice, setIsTestingHistory)}
            disabled={isTestingHistory || !selectedHistoryVoice}
            className="shrink-0"
          >
            {isTestingHistory ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Dinle
          </Button>
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

        {/* Voice Presets with Add New option */}
        <div className="flex flex-col md:flex-row gap-3 items-end pt-4 border-t">
          <div className="flex-1 space-y-1.5">
            <Label>Hazır Sesler</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                <SelectItem value={ADD_NEW_VALUE}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    <span>Yeni Ekle</span>
                  </div>
                </SelectItem>
                {VOICE_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => handleTestVoice(selectedPreset === ADD_NEW_VALUE ? voiceId : selectedPreset)}
            disabled={isTesting || (!selectedPreset && !isAddingNew) || (isAddingNew && !voiceId)}
            className="shrink-0"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Dinle
          </Button>
        </div>

        {/* Voice ID and Name - Only visible when Add New is selected */}
        {isAddingNew && (
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Ses ID</Label>
              <Input
                placeholder="örn: S85IPTaQ0TGGMhJkucvb"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Ses Adı</Label>
              <Input
                placeholder="örn: Thomas"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Save to History Button - Shows when preset selected or adding new */}
        {(selectedPreset || isAddingNew) && (
          <Button
            onClick={handleSaveToHistory}
            disabled={isUpdating || isSaving || !voiceId || !voiceName}
            className="w-full md:w-auto"
          >
            Kayıtlı Seslere Ekle
          </Button>
        )}

        {/* Voice Settings */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-medium">Ses Ayarları (API)</Label>
          
          {/* Model Selection */}
          <div className="space-y-1.5">
            <Label className="text-sm">Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Model seçin..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                {ELEVENLABS_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stability */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Stability</Label>
                <span className="text-sm text-muted-foreground">{voiceSettings.stability.toFixed(2)}</span>
              </div>
              <Slider
                value={[voiceSettings.stability]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, stability: value }))}
                min={0}
                max={1}
                step={0.05}
              />
            </div>

            {/* Similarity Boost */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Similarity Boost</Label>
                <span className="text-sm text-muted-foreground">{voiceSettings.similarity_boost.toFixed(2)}</span>
              </div>
              <Slider
                value={[voiceSettings.similarity_boost]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, similarity_boost: value }))}
                min={0}
                max={1}
                step={0.05}
              />
            </div>

            {/* Style */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Style</Label>
                <span className="text-sm text-muted-foreground">{voiceSettings.style.toFixed(2)}</span>
              </div>
              <Slider
                value={[voiceSettings.style]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, style: value }))}
                min={0}
                max={1}
                step={0.05}
              />
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Speed</Label>
                <span className="text-sm text-muted-foreground">{voiceSettings.speed.toFixed(2)}</span>
              </div>
              <Slider
                value={[voiceSettings.speed]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, speed: value }))}
                min={0.7}
                max={1.2}
                step={0.05}
              />
            </div>
          </div>

          {/* Speaker Boost Switch */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Speaker Boost</Label>
            <Switch
              checked={voiceSettings.use_speaker_boost}
              onCheckedChange={(checked) => setVoiceSettings(prev => ({ ...prev, use_speaker_boost: checked }))}
            />
          </div>

          {/* Save Voice Settings Button */}
          <Button
            onClick={handleSaveVoiceSettings}
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            Ses Ayarlarını Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
