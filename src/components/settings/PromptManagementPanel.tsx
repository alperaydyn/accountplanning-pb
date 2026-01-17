import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  usePromptTemplates, 
  usePromptVersions, 
  usePromptTestCases,
  usePromptTestResults,
  useCreatePromptTemplate,
  useUpdatePromptTemplate,
  useCreatePromptVersion,
  useSetActiveVersion,
  useCreateTestCase,
  useDeleteTestCase,
  useSaveTestResult,
  PromptTemplate,
  PromptVersion,
  PromptTestCase,
} from "@/hooks/usePromptTemplates";
import { 
  FileText, 
  Plus, 
  Play, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight,
  History,
  TestTube,
  Save,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export function PromptManagementPanel() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isCreatingTestCase, setIsCreatingTestCase] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    testCaseId: string;
    testCaseName: string;
    passed: boolean | null;
    evaluationNotes: string;
    errorMessage: string | null;
  }>>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  // Form states
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    where_used: '',
    input_description: '',
    output_description: '',
  });
  const [newVersion, setNewVersion] = useState({
    prompt_text: '',
    reason: '',
    explanation: '',
    creator_name: '',
  });
  const [newTestCase, setNewTestCase] = useState({
    name: '',
    input_data: '{}',
    expected_output: '{}',
    is_regression_test: false,
  });

  // Queries
  const { data: templates = [], isLoading: loadingTemplates } = usePromptTemplates();
  const { data: versions = [], isLoading: loadingVersions } = usePromptVersions(selectedTemplate?.id ?? null);
  const { data: testCases = [], isLoading: loadingTestCases } = usePromptTestCases(selectedTemplate?.id ?? null);
  const { data: versionTestResults = [] } = usePromptTestResults(selectedVersion?.id ?? null);

  // Mutations
  const createTemplate = useCreatePromptTemplate();
  const updateTemplate = useUpdatePromptTemplate();
  const createVersion = useCreatePromptVersion();
  const setActiveVersion = useSetActiveVersion();
  const createTestCase = useCreateTestCase();
  const deleteTestCase = useDeleteTestCase();
  const saveTestResult = useSaveTestResult();

  const handleCreateTemplate = async () => {
    try {
      await createTemplate.mutateAsync(newTemplate);
      setIsCreatingTemplate(false);
      setNewTemplate({ name: '', description: '', where_used: '', input_description: '', output_description: '' });
      toast({ title: "Şablon oluşturuldu" });
    } catch (error) {
      toast({ 
        title: "Hata", 
        description: error instanceof Error ? error.message : "Şablon oluşturulamadı",
        variant: "destructive" 
      });
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedTemplate) return;
    
    const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;
    
    try {
      const version = await createVersion.mutateAsync({
        prompt_template_id: selectedTemplate.id,
        version_number: nextVersion,
        prompt_text: newVersion.prompt_text,
        reason: newVersion.reason,
        explanation: newVersion.explanation || null,
        creator_name: newVersion.creator_name,
        is_active: false,
      });
      setIsCreatingVersion(false);
      setNewVersion({ prompt_text: '', reason: '', explanation: '', creator_name: '' });
      setSelectedVersion(version);
      toast({ title: `Versiyon ${nextVersion} oluşturuldu` });
    } catch (error) {
      toast({ 
        title: "Hata", 
        description: error instanceof Error ? error.message : "Versiyon oluşturulamadı",
        variant: "destructive" 
      });
    }
  };

  const handleCreateTestCase = async () => {
    if (!selectedTemplate) return;
    
    try {
      const inputData = JSON.parse(newTestCase.input_data);
      const expectedOutput = JSON.parse(newTestCase.expected_output);
      
      await createTestCase.mutateAsync({
        prompt_template_id: selectedTemplate.id,
        name: newTestCase.name,
        input_data: inputData,
        expected_output: expectedOutput,
        is_regression_test: newTestCase.is_regression_test,
      });
      setIsCreatingTestCase(false);
      setNewTestCase({ name: '', input_data: '{}', expected_output: '{}', is_regression_test: false });
      toast({ title: "Test senaryosu oluşturuldu" });
    } catch (error) {
      toast({ 
        title: "Hata", 
        description: error instanceof Error ? error.message : "Geçersiz JSON formatı",
        variant: "destructive" 
      });
    }
  };

  const handleRunTests = async () => {
    if (!selectedVersion || testCases.length === 0) return;
    
    setIsRunningTests(true);
    setTestResults([]);
    
    try {
      const session = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('test-prompt', {
        body: {
          promptText: selectedVersion.prompt_text,
          testCases,
          templateName: selectedTemplate?.name,
        },
      });
      
      if (response.error) throw response.error;
      
      const data = response.data;
      setTestResults(data.results);
      
      // Save results to database
      for (const result of data.results) {
        await saveTestResult.mutateAsync({
          prompt_version_id: selectedVersion.id,
          test_case_id: result.testCaseId,
          actual_output: result.actualOutput,
          passed: result.passed,
          evaluation_notes: result.evaluationNotes,
          execution_time_ms: result.executionTimeMs,
          error_message: result.errorMessage,
        });
      }
      
      toast({
        title: "Testler tamamlandı",
        description: `${data.summary.passed}/${data.summary.total} test başarılı`,
      });
    } catch (error) {
      toast({
        title: "Test hatası",
        description: error instanceof Error ? error.message : "Testler çalıştırılamadı",
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleSetActive = async () => {
    if (!selectedVersion || !selectedTemplate) return;
    
    const allPassed = testResults.every(r => r.passed === true);
    
    if (!allPassed && testResults.length > 0) {
      toast({
        title: "Uyarı",
        description: "Bazı testler başarısız. Yine de aktif etmek istiyor musunuz?",
        variant: "destructive",
      });
    }
    
    try {
      await setActiveVersion.mutateAsync({ 
        versionId: selectedVersion.id, 
        templateId: selectedTemplate.id 
      });
      toast({ title: "Versiyon aktif edildi" });
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Aktif edilemedi",
        variant: "destructive",
      });
    }
  };

  const toggleVersionExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prompt Yönetimi
        </CardTitle>
        <CardDescription>
          AI promptlarını versiyonlu olarak yönetin, test edin ve aktif versiyonu belirleyin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Templates List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Prompt Şablonları</h3>
              <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Yeni
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Yeni Prompt Şablonu</DialogTitle>
                    <DialogDescription>
                      Yeni bir prompt şablonu oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>İsim</Label>
                      <Input 
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="generate-actions"
                      />
                    </div>
                    <div>
                      <Label>Açıklama</Label>
                      <Textarea 
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        placeholder="Bu prompt ne iş yapar?"
                      />
                    </div>
                    <div>
                      <Label>Kullanım Yeri</Label>
                      <Input 
                        value={newTemplate.where_used}
                        onChange={(e) => setNewTemplate({ ...newTemplate, where_used: e.target.value })}
                        placeholder="supabase/functions/generate-actions"
                      />
                    </div>
                    <div>
                      <Label>Beklenen Girdiler</Label>
                      <Textarea 
                        value={newTemplate.input_description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, input_description: e.target.value })}
                        placeholder="Müşteri bilgileri, ürün listesi, sahip olunan ürünler..."
                      />
                    </div>
                    <div>
                      <Label>Beklenen Çıktılar</Label>
                      <Textarea 
                        value={newTemplate.output_description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, output_description: e.target.value })}
                        placeholder="Aksiyon listesi JSON formatında..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatingTemplate(false)}>İptal</Button>
                    <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                      {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Oluştur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <ScrollArea className="h-[400px] border rounded-md">
              {loadingTemplates ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                  <FileText className="h-8 w-8 mb-2" />
                  <p>Henüz şablon yok</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setSelectedVersion(null);
                        setTestResults([]);
                      }}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Template Details & Versions */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">Detaylar</TabsTrigger>
                  <TabsTrigger value="versions">
                    <History className="h-4 w-4 mr-1" />
                    Versiyonlar ({versions.length})
                  </TabsTrigger>
                  <TabsTrigger value="tests">
                    <TestTube className="h-4 w-4 mr-1" />
                    Test Senaryoları ({testCases.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Kullanım Yeri</Label>
                      <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                        {selectedTemplate.where_used}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Son Güncelleme</Label>
                      <p className="text-sm mt-1">
                        {new Date(selectedTemplate.updated_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Beklenen Girdiler</Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                      {selectedTemplate.input_description}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Beklenen Çıktılar</Label>
                    <p className="text-sm bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                      {selectedTemplate.output_description}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="versions" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Versiyon Geçmişi</h4>
                    <Dialog open={isCreatingVersion} onOpenChange={setIsCreatingVersion}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Yeni Versiyon
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Yeni Prompt Versiyonu</DialogTitle>
                          <DialogDescription>
                            {selectedTemplate.name} için yeni bir versiyon oluşturun
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Prompt Metni</Label>
                            <Textarea 
                              value={newVersion.prompt_text}
                              onChange={(e) => setNewVersion({ ...newVersion, prompt_text: e.target.value })}
                              placeholder="System prompt metni..."
                              rows={10}
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Değişiklik Nedeni</Label>
                              <Input 
                                value={newVersion.reason}
                                onChange={(e) => setNewVersion({ ...newVersion, reason: e.target.value })}
                                placeholder="Neden bu değişiklik yapıldı?"
                              />
                            </div>
                            <div>
                              <Label>Oluşturan</Label>
                              <Input 
                                value={newVersion.creator_name}
                                onChange={(e) => setNewVersion({ ...newVersion, creator_name: e.target.value })}
                                placeholder="İsminiz"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Açıklama (Opsiyonel)</Label>
                            <Textarea 
                              value={newVersion.explanation}
                              onChange={(e) => setNewVersion({ ...newVersion, explanation: e.target.value })}
                              placeholder="Detaylı açıklama..."
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreatingVersion(false)}>İptal</Button>
                          <Button onClick={handleCreateVersion} disabled={createVersion.isPending}>
                            {createVersion.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Oluştur
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <ScrollArea className="h-[350px]">
                    {loadingVersions ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : versions.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        Henüz versiyon yok
                      </div>
                    ) : (
                      <div className="space-y-2 pr-4">
                        {versions.map((version) => (
                          <Collapsible
                            key={version.id}
                            open={expandedVersions.has(version.id)}
                            onOpenChange={() => toggleVersionExpanded(version.id)}
                          >
                            <div className={`border rounded-md ${
                              selectedVersion?.id === version.id ? 'border-primary' : ''
                            }`}>
                              <CollapsibleTrigger asChild>
                                <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50">
                                  <div className="flex items-center gap-2">
                                    {expandedVersions.has(version.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                    <span className="font-medium">v{version.version_number}</span>
                                    {version.is_active && (
                                      <Badge variant="default" className="text-xs">Aktif</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{version.creator_name}</span>
                                    <span>•</span>
                                    <span>{new Date(version.created_at).toLocaleDateString('tr-TR')}</span>
                                  </div>
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-3 pt-0 space-y-3 border-t">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Değişiklik Nedeni</Label>
                                    <p className="text-sm">{version.reason}</p>
                                  </div>
                                  {version.explanation && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Açıklama</Label>
                                      <p className="text-sm">{version.explanation}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Prompt</Label>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-h-32">
                                      {version.prompt_text.substring(0, 500)}
                                      {version.prompt_text.length > 500 && '...'}
                                    </pre>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant={selectedVersion?.id === version.id ? "default" : "outline"}
                                      onClick={() => setSelectedVersion(version)}
                                    >
                                      {selectedVersion?.id === version.id ? (
                                        <>
                                          <Check className="h-4 w-4 mr-1" />
                                          Seçili
                                        </>
                                      ) : (
                                        'Test İçin Seç'
                                      )}
                                    </Button>
                                    {!version.is_active && selectedVersion?.id === version.id && (
                                      <Button 
                                        size="sm" 
                                        variant="secondary"
                                        onClick={handleSetActive}
                                        disabled={setActiveVersion.isPending}
                                      >
                                        <Save className="h-4 w-4 mr-1" />
                                        Aktif Et
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="tests" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Test Senaryoları</h4>
                    <div className="flex gap-2">
                      {selectedVersion && testCases.length > 0 && (
                        <Button 
                          size="sm" 
                          onClick={handleRunTests}
                          disabled={isRunningTests}
                        >
                          {isRunningTests ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Testleri Çalıştır
                        </Button>
                      )}
                      <Dialog open={isCreatingTestCase} onOpenChange={setIsCreatingTestCase}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Test Ekle
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Yeni Test Senaryosu</DialogTitle>
                            <DialogDescription>
                              Promptun beklenen davranışını test etmek için senaryo ekleyin
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Test Adı</Label>
                              <Input 
                                value={newTestCase.name}
                                onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                                placeholder="Örn: Küçük segment müşteri aksiyonları"
                              />
                            </div>
                            <div>
                              <Label>Girdi (JSON)</Label>
                              <Textarea 
                                value={newTestCase.input_data}
                                onChange={(e) => setNewTestCase({ ...newTestCase, input_data: e.target.value })}
                                placeholder='{"customer": {...}, "products": [...]}'
                                rows={6}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <Label>Beklenen Çıktı (JSON)</Label>
                              <Textarea 
                                value={newTestCase.expected_output}
                                onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                                placeholder='{"actions": [...]}'
                                rows={6}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                id="regression"
                                checked={newTestCase.is_regression_test}
                                onChange={(e) => setNewTestCase({ ...newTestCase, is_regression_test: e.target.checked })}
                              />
                              <Label htmlFor="regression" className="text-sm font-normal">
                                Regresyon testi (her versiyonda çalıştırılmalı)
                              </Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreatingTestCase(false)}>İptal</Button>
                            <Button onClick={handleCreateTestCase} disabled={createTestCase.isPending}>
                              {createTestCase.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Ekle
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {!selectedVersion && testCases.length > 0 && (
                    <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                      Testleri çalıştırmak için bir versiyon seçin
                    </div>
                  )}

                  <ScrollArea className="h-[300px]">
                    {loadingTestCases ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : testCases.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        Henüz test senaryosu yok
                      </div>
                    ) : (
                      <div className="space-y-2 pr-4">
                        {testCases.map((testCase) => {
                          const result = testResults.find(r => r.testCaseId === testCase.id);
                          return (
                            <div key={testCase.id} className="border rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {result ? (
                                    result.passed === true ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : result.passed === false ? (
                                      <AlertCircle className="h-4 w-4 text-destructive" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    )
                                  ) : null}
                                  <span className="font-medium text-sm">{testCase.name}</span>
                                  {testCase.is_regression_test && (
                                    <Badge variant="secondary" className="text-xs">Regresyon</Badge>
                                  )}
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6"
                                  onClick={() => deleteTestCase.mutate({ 
                                    id: testCase.id, 
                                    templateId: selectedTemplate.id 
                                  })}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {result && (
                                <div className="mt-2 text-sm">
                                  {result.errorMessage ? (
                                    <p className="text-destructive">{result.errorMessage}</p>
                                  ) : result.evaluationNotes ? (
                                    <p className="text-muted-foreground">{result.evaluationNotes}</p>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                <FileText className="h-12 w-12 mb-4" />
                <p>Detayları görmek için bir şablon seçin</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
