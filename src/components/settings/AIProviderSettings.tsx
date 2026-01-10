import { useState, useEffect } from "react";
import { Bot, Key, Server, TestTube2, Loader2, CheckCircle2, XCircle, Info, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AIProvider = 'lovable' | 'openai' | 'openrouter' | 'local';

interface ProviderOption {
  value: AIProvider;
  label: string;
  description: string;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
}

const PROVIDERS: ProviderOption[] = [
  { value: 'lovable', label: 'Lovable AI', description: 'Built-in AI (no API key needed)', requiresApiKey: false, requiresBaseUrl: false },
  { value: 'openai', label: 'OpenAI', description: 'GPT-4, GPT-4o, etc.', requiresApiKey: true, requiresBaseUrl: false },
  { value: 'openrouter', label: 'OpenRouter', description: 'Access multiple AI models', requiresApiKey: true, requiresBaseUrl: false },
  { value: 'local', label: 'Local', description: 'LM Studio, Ollama, vLLM', requiresApiKey: false, requiresBaseUrl: true },
];

const PRESET_MODELS: Record<AIProvider, { value: string; label: string }[]> = {
  lovable: [
    { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (recommended)' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'openai/gpt-5', label: 'GPT-5' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (recommended)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  openrouter: [
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro Preview' },
    { value: 'google/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash Preview' },
    { value: 'google/gemma-3-27b-it', label: 'Gemma 3 27B' },
    { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
    { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    { value: 'mistralai/mistral-large-2411', label: 'Mistral Large' },
    { value: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek V3' },
    { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
  ],
  local: [
    { value: 'llama3', label: 'Llama 3' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'codellama', label: 'Code Llama' },
    { value: 'phi', label: 'Phi' },
    { value: 'qwen2.5', label: 'Qwen 2.5' },
  ],
};

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  const first4 = key.slice(0, 4);
  const last4 = key.slice(-4);
  const middleLength = Math.min(key.length - 8, 16);
  const masked = '•'.repeat(middleLength);
  return `${first4}${masked}${last4}`;
}

export function AIProviderSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { settings, updateSettingsAsync, isUpdating } = useUserSettings();
  
  const [provider, setProvider] = useState<AIProvider>('lovable');
  const [model, setModel] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedApiKeyMasked, setSavedApiKeyMasked] = useState<string | null>(null);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);

  // Load settings
  useEffect(() => {
    if (settings) {
      const savedProvider = (settings as any).ai_provider || 'lovable';
      setProvider(savedProvider);
      setModel((settings as any).ai_model || '');
      setBaseUrl((settings as any).ai_base_url || '');
      
      // Check if there's a saved API key
      const savedKey = (settings as any).ai_api_key_encrypted;
      if (savedKey) {
        setSavedApiKeyMasked(maskApiKey(savedKey));
        setIsEditingApiKey(false);
      } else {
        setSavedApiKeyMasked(null);
        setIsEditingApiKey(true);
      }
    }
  }, [settings]);

  const currentProvider = PROVIDERS.find(p => p.value === provider);
  const presetModels = PRESET_MODELS[provider] || [];
  const isCustomModel = model === 'custom' || (model && !presetModels.some(m => m.value === model));

  const handleProviderChange = (value: AIProvider) => {
    setProvider(value);
    setModel('');
    setCustomModel('');
    setApiKey('');
    setBaseUrl('');
    setTestResult(null);
    setHasUnsavedChanges(true);
    setIsEditingApiKey(true);
    setSavedApiKeyMasked(null);
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    if (value !== 'custom') {
      setCustomModel('');
    }
    setTestResult(null);
    setHasUnsavedChanges(true);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setHasUnsavedChanges(true);
    setIsEditingApiKey(true);
  };

  const handleEditApiKey = () => {
    setIsEditingApiKey(true);
    setApiKey('');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const resolvedModel = model === 'custom' ? customModel : model;
      
      // Use new API key if provided, otherwise test will use saved key
      const testApiKey = isEditingApiKey && apiKey ? apiKey : null;

      const response = await supabase.functions.invoke('test-ai-connection', {
        body: {
          provider,
          model: resolvedModel || null,
          apiKey: testApiKey,
          baseUrl: baseUrl || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setTestResult({
        success: response.data.success,
        message: response.data.message,
      });

      if (response.data.success) {
        toast({
          title: "Bağlantı Başarılı",
          description: response.data.message,
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const resolvedModel = model === 'custom' ? customModel : model;
      
      const updates: any = {
        ai_provider: provider,
        ai_model: resolvedModel || null,
        ai_base_url: baseUrl || null,
      };

      // Only update API key if user entered a new one
      if (isEditingApiKey && apiKey) {
        updates.ai_api_key_encrypted = apiKey;
      }

      await updateSettingsAsync(updates);

      toast({
        title: "Ayarlar Kaydedildi",
        description: "AI sağlayıcı ayarlarınız güncellendi.",
      });
      
      setHasUnsavedChanges(false);
      
      // Update masked key display if new key was saved
      if (isEditingApiKey && apiKey) {
        setSavedApiKeyMasked(maskApiKey(apiKey));
        setApiKey('');
        setIsEditingApiKey(false);
      }
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
          <Bot className="h-5 w-5" />
          AI Sağlayıcı Ayarları
        </CardTitle>
        <CardDescription>
          AI özelliklerinde kullanılacak sağlayıcı ve modeli seçin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider and Model Selection - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Sağlayıcı</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col">
                      <span>{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Model</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hazır modellerden seçin veya özel model adı girin</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={isCustomModel ? 'custom' : model} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Model seçin" />
              </SelectTrigger>
              <SelectContent>
                {presetModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex flex-col">
                      <span>{m.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{m.value}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">Özel model adı gir...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Model Input */}
        {(model === 'custom' || isCustomModel) && (
          <div className="space-y-2">
            <Label>Özel Model Adı</Label>
            <Input
              placeholder={provider === 'openrouter' ? 'örn: google/gemma-3-27b-it' : 'örn: gpt-4-turbo-preview'}
              value={customModel || model}
              onChange={(e) => {
                setCustomModel(e.target.value);
                setModel('custom');
                setHasUnsavedChanges(true);
              }}
            />
            {provider === 'openrouter' && (
              <p className="text-xs text-muted-foreground">
                OpenRouter model formatı: provider/model-name (örn: anthropic/claude-sonnet-4)
              </p>
            )}
          </div>
        )}

        {/* API Key (if required) */}
        {currentProvider?.requiresApiKey && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <Label>API Anahtarı</Label>
            </div>
            
            {savedApiKeyMasked && !isEditingApiKey ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                  {savedApiKeyMasked}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditApiKey}
                >
                  Değiştir
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="API anahtarınızı girin"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {provider === 'openai' && 'OpenAI API anahtarınız (sk-... ile başlar)'}
              {provider === 'openrouter' && 'OpenRouter API anahtarınız (openrouter.ai/keys adresinden alın)'}
            </p>
          </div>
        )}

        {/* Base URL (for local provider) */}
        {currentProvider?.requiresBaseUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <Label>Sunucu Adresi</Label>
            </div>
            <Input
              placeholder="http://localhost:1234"
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setHasUnsavedChanges(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              OpenAI uyumlu API endpoint (örn: LM Studio, Ollama, vLLM)
            </p>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            testResult.success ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || (currentProvider?.requiresBaseUrl && !baseUrl)}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube2 className="h-4 w-4 mr-2" />
            )}
            Bağlantıyı Test Et
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isUpdating || !hasUnsavedChanges}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
