import { useState, useEffect } from "react";
import { Bot, Key, Server, TestTube2, Loader2, CheckCircle2, XCircle, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";

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

const DEFAULT_TEST_PROMPT = "Merhaba! Türkiye'nin başkenti neresidir? Kısa bir cevap ver.";

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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; response?: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedApiKeyMasked, setSavedApiKeyMasked] = useState<string | null>(null);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [testPrompt, setTestPrompt] = useState(DEFAULT_TEST_PROMPT);

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
      const resolvedModel = model === 'custom' ? customModel : model;

      // For local provider, make direct browser call (edge functions can't reach localhost)
      if (provider === 'local') {
        if (!baseUrl) {
          setTestResult({
            success: false,
            message: 'Sunucu adresi gerekli',
          });
          setIsTesting(false);
          return;
        }

        const endpoint = baseUrl.endsWith('/v1/chat/completions')
          ? baseUrl
          : `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

        const prompt = testPrompt || 'Say "OK" in one word.';
        const maxTokens = testPrompt ? 500 : 10;

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: resolvedModel || 'llama3',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: maxTokens,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Bağlantı hatası';
            if (response.status === 404) {
              errorMessage = 'Model bulunamadı veya endpoint geçersiz';
            } else if (response.status === 0) {
              errorMessage = 'Sunucuya bağlanılamadı. CORS veya ağ hatası olabilir.';
            } else {
              errorMessage = `Hata ${response.status}: ${errorText.substring(0, 100)}`;
            }

            setTestResult({
              success: false,
              message: errorMessage,
            });
            setIsTesting(false);
            return;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || 'Yanıt yok';

          setTestResult({
            success: true,
            message: `Bağlantı başarılı (${resolvedModel || 'llama3'})`,
            response: content,
          });

          toast({
            title: "Bağlantı Başarılı",
            description: `Yerel sunucu bağlantısı başarılı`,
          });
        } catch (fetchError) {
          console.error('Local API fetch error:', fetchError);
          setTestResult({
            success: false,
            message: fetchError instanceof Error 
              ? `Bağlantı hatası: ${fetchError.message}. Sunucunun çalıştığından ve CORS ayarlarının yapıldığından emin olun.`
              : 'Sunucuya bağlanılamadı',
          });
        }
        setIsTesting(false);
        return;
      }

      // For other providers, use edge function
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        setTestResult({
          success: false,
          message: 'Kimlik doğrulama gerekli',
        });
        setIsTesting(false);
        return;
      }

      // Use new API key if provided, otherwise test will use saved key
      const testApiKey = isEditingApiKey && apiKey ? apiKey : null;

      const response = await supabase.functions.invoke('test-ai-connection', {
        body: {
          provider,
          model: resolvedModel || null,
          apiKey: testApiKey,
          baseUrl: baseUrl || null,
          testPrompt: testPrompt,
        },
      });

      if (response.error) {
        setTestResult({
          success: false,
          message: response.error.message || 'Bağlantı hatası',
        });
        setIsTesting(false);
        return;
      }

      setTestResult({
        success: response.data.success,
        message: response.data.message,
        response: response.data.response,
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
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
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

  const getSelectedProviderLabel = () => {
    const selected = PROVIDERS.find(p => p.value === provider);
    return selected?.label || 'Seçiniz';
  };

  const getSelectedModelLabel = () => {
    if (isCustomModel && customModel) return customModel;
    if (model === 'custom') return 'Özel model';
    const selected = presetModels.find(m => m.value === model);
    return selected?.label || 'Model seçin';
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
                <SelectValue>{getSelectedProviderLabel()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span>{p.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground h-4">{currentProvider?.description}</p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={isCustomModel ? 'custom' : model} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Model seçin">{getSelectedModelLabel()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {presetModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <span>{m.label}</span>
                  </SelectItem>
                ))}
                <SelectItem value="custom">Özel model adı gir...</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground font-mono h-4 truncate">
              {model && model !== 'custom' ? model : (isCustomModel && customModel ? customModel : '\u00A0')}
            </p>
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

        {/* Test Result */}
        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            testResult.success ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}

        {/* Collapsible Test Panel */}
        <Collapsible open={isTestPanelOpen} onOpenChange={setIsTestPanelOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
              <span className="text-sm font-medium">Test Detayları</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isTestPanelOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Test Metni</Label>
              <Textarea
                placeholder="Test için gönderilecek mesajı yazın..."
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                AI modeline gönderilecek test mesajı. Varsayılan metin kullanabilir veya özelleştirebilirsiniz.
              </p>
            </div>
            
            {testResult?.response && (
              <div className="space-y-2">
                <Label>AI Yanıtı</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{testResult.response}</p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
