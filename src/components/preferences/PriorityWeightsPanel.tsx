import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Scale, Target, TrendingUp, Heart, Wallet, Loader2 } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface PriorityWeight {
  key: 'priority_weight_portfolio' | 'priority_weight_adhoc' | 'priority_weight_customer' | 'priority_weight_profitability';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PriorityWeightsPanel = () => {
  const { t } = useLanguage();
  const { settings, updateSettingsAsync, isUpdating, isLoading } = useUserSettings();
  
  const [weights, setWeights] = useState({
    priority_weight_portfolio: 0.25,
    priority_weight_adhoc: 0.25,
    priority_weight_customer: 0.25,
    priority_weight_profitability: 0.25,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with settings from database
  useEffect(() => {
    if (settings) {
      setWeights({
        priority_weight_portfolio: (settings as any).priority_weight_portfolio ?? 0.25,
        priority_weight_adhoc: (settings as any).priority_weight_adhoc ?? 0.25,
        priority_weight_customer: (settings as any).priority_weight_customer ?? 0.25,
        priority_weight_profitability: (settings as any).priority_weight_profitability ?? 0.25,
      });
      setHasChanges(false);
    }
  }, [settings]);

  const priorityWeights: PriorityWeight[] = [
    {
      key: 'priority_weight_portfolio',
      label: 'Portföy Hedef Uyumu',
      description: 'Portföyün geride kaldığı hedeflere destek olacak ürünlere ait aksiyonların önceliklendirilmesi. Hedef gerçekleşme oranları düşük olan ürünlerdeki aksiyonlar daha yüksek öncelik alır.',
      icon: <Target className="h-5 w-5" />,
      color: 'text-chart-1',
    },
    {
      key: 'priority_weight_adhoc',
      label: 'Ad-Hoc Banka Öncelikleri',
      description: 'Bankanın dönemsel hedeflerine (APKO toplantısı kararları gibi) destek olacak ürünlere ait aksiyonların önceliklendirilmesi. Örneğin, bu hafta sigorta ürününe ağırlık verilmesi gibi.',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-chart-2',
    },
    {
      key: 'priority_weight_customer',
      label: 'Müşteri Memnuniyeti',
      description: 'Müşteri memnuniyeti ve tutundurmasına yönelik aksiyonların önceliklendirilmesi. Müşteri ilişkisini güçlendirecek ve sadakati artıracak aksiyonlar daha yüksek öncelik alır.',
      icon: <Heart className="h-5 w-5" />,
      color: 'text-chart-3',
    },
    {
      key: 'priority_weight_profitability',
      label: 'Karlılık',
      description: 'Karlılığı artıracak aksiyonların önceliklendirilmesi. Yüksek getiri potansiyeli olan müşteri ve ürün kombinasyonlarındaki aksiyonlar daha yüksek öncelik alır.',
      icon: <Wallet className="h-5 w-5" />,
      color: 'text-chart-4',
    },
  ];

  const handleWeightChange = (key: PriorityWeight['key'], value: number[]) => {
    setWeights(prev => ({
      ...prev,
      [key]: value[0],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettingsAsync(weights as any);
      setHasChanges(false);
      toast({
        title: "Başarılı",
        description: "Öncelik ağırlıkları kaydedildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setWeights({
      priority_weight_portfolio: 0.25,
      priority_weight_adhoc: 0.25,
      priority_weight_customer: 0.25,
      priority_weight_profitability: 0.25,
    });
    setHasChanges(true);
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Aksiyon Öncelik Ağırlıkları
        </CardTitle>
        <CardDescription>
          Aksiyon önceliklendirmesinde kullanılacak kriterlerin ağırlıklarını belirleyin. 
          Her kriter için ağırlık %0 ile %50 arasında ayarlanabilir (varsayılan: %25).
          Bu ayarlar sadece sizin portföyünüz için geçerli olacaktır.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {priorityWeights.map((priority) => (
          <div key={priority.key} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${priority.color}`}>
                {priority.icon}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{priority.label}</Label>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    %{Math.round(weights[priority.key] * 100)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {priority.description}
                </p>
              </div>
            </div>
            <div className="pl-8">
              <Slider
                value={[weights[priority.key]]}
                onValueChange={(value) => handleWeightChange(priority.key, value)}
                min={0}
                max={0.50}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">%0</span>
                <span className="text-xs text-muted-foreground">%25</span>
                <span className="text-xs text-muted-foreground">%50</span>
              </div>
            </div>
          </div>
        ))}

        {/* Total weight indicator */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Toplam Ağırlık:</span>
            <span className={`font-semibold tabular-nums ${
              Math.abs(totalWeight - 1) < 0.01 
                ? 'text-success' 
                : 'text-warning'
            }`}>
              %{Math.round(totalWeight * 100)}
            </span>
          </div>
          {Math.abs(totalWeight - 1) >= 0.01 && (
            <p className="text-xs text-warning mt-1">
              Toplam ağırlık %100'den farklı. Sistem otomatik normalizasyon uygulayacaktır.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isUpdating}
          >
            Varsayılana Sıfırla
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Kaydediliyor...
              </>
            ) : (
              'Kaydet'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriorityWeightsPanel;
