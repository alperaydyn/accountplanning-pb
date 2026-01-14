import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomers } from "@/hooks/useCustomers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  Target, 
  Star, 
  Building2, 
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from "lucide-react";

// Status colors matching the journey visualization
const statusColors = {
  "Yeni Müşteri": { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-500/10" },
  "Aktif": { bg: "bg-sky-500", text: "text-sky-500", light: "bg-sky-500/10" },
  "Target": { bg: "bg-blue-500", text: "text-blue-500", light: "bg-blue-500/10" },
  "Strong Target": { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-500/10" },
  "Ana Banka": { bg: "bg-primary", text: "text-primary", light: "bg-primary/10" },
};

const CustomerJourney = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { data: customers = [], isLoading } = useCustomers();

  // Calculate customer counts by status
  const statusCounts = useMemo(() => {
    const counts = {
      "Yeni Müşteri": 0,
      "Aktif": 0,
      "Target": 0,
      "Strong Target": 0,
      "Ana Banka": 0,
    };
    customers.forEach((c) => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [customers]);

  // Journey stages with icons and descriptions
  const journeyStages = [
    {
      key: "Yeni Müşteri",
      icon: Users,
      title: t.customerStatusLabels["Yeni Müşteri"],
      description: language === "tr" 
        ? "Yeni kazanılmış ve aktif olan müşteriler" 
        : "Newly acquired and active customers",
      tips: language === "tr" 
        ? ["İlk görüşmeyi planla", "İhtiyaç analizi yap", "Temel ürünleri tanıt"]
        : ["Schedule first meeting", "Conduct needs analysis", "Introduce basic products"],
    },
    {
      key: "Aktif",
      icon: TrendingUp,
      title: t.customerStatusLabels["Aktif"],
      description: language === "tr" 
        ? "Aktiflik kriterlerinden en az birini sağlamış müşteriler" 
        : "Customers meeting at least one activity criteria",
      tips: language === "tr" 
        ? ["Ürün kullanımını artır", "Çapraz satış fırsatları", "Düzenli ziyaret planla"]
        : ["Increase product usage", "Cross-sell opportunities", "Plan regular visits"],
    },
    {
      key: "Target",
      icon: Target,
      title: t.customerStatusLabels["Target"],
      description: language === "tr" 
        ? "İlgili segmentin hedef müşteri tanımına göre etkin olan müşteriler" 
        : "Customers active based on segment target definitions",
      tips: language === "tr" 
        ? ["Cüzdan payını analiz et", "Rekabet analizi yap", "Özelleştirilmiş teklifler sun"]
        : ["Analyze wallet share", "Conduct competitor analysis", "Offer customized deals"],
    },
    {
      key: "Strong Target",
      icon: Star,
      title: t.customerStatusLabels["Strong Target"],
      description: language === "tr" 
        ? "İlgili segmentin güçlü müşteri tanımına göre etkin olan müşteriler" 
        : "Customers active based on strong customer definitions",
      tips: language === "tr" 
        ? ["Premium ürünler sun", "İlişkiyi derinleştir", "Stratejik ortaklık kur"]
        : ["Offer premium products", "Deepen relationship", "Build strategic partnership"],
    },
    {
      key: "Ana Banka",
      icon: Building2,
      title: t.customerStatusLabels["Ana Banka"],
      description: language === "tr" 
        ? "En yoğun çalışma yapılan ana banka olmak" 
        : "Being the primary bank with the highest engagement",
      tips: language === "tr" 
        ? ["İlişkiyi koru", "Yeni ihtiyaçları takip et", "Sadakat programları uygula"]
        : ["Maintain relationship", "Track new needs", "Implement loyalty programs"],
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <PageBreadcrumb items={[{ label: t.nav.customerJourney }]} />
          <h1 className="text-2xl font-bold text-foreground">
            {t.dashboard.customerJourney}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "tr" 
              ? "Müşterilerinizi bir üst seviyeye taşımak için yol haritası" 
              : "Roadmap to elevate your customers to the next level"}
          </p>
        </div>

        {/* Hero Journey Visualization */}
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            {/* Road Background */}
            <div className="relative bg-gradient-to-br from-muted/50 to-muted py-8 px-4">
              {/* Road Path */}
              <div className="relative max-w-6xl mx-auto">
                {/* Curved Road SVG */}
                <svg 
                  viewBox="0 0 1200 200" 
                  className="w-full h-auto"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Road background */}
                  <path
                    d="M 0 150 Q 150 150 250 120 Q 400 70 550 90 Q 700 110 850 60 Q 1000 10 1200 30"
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="60"
                    strokeLinecap="round"
                    opacity="0.2"
                  />
                  {/* Road center line */}
                  <path
                    d="M 0 150 Q 150 150 250 120 Q 400 70 550 90 Q 700 110 850 60 Q 1000 10 1200 30"
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="2"
                    strokeDasharray="10 10"
                    opacity="0.5"
                  />
                </svg>

                {/* Stage Markers on the Road */}
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  {journeyStages.map((stage, index) => {
                    const colors = statusColors[stage.key as keyof typeof statusColors];
                    const count = statusCounts[stage.key as keyof typeof statusCounts];
                    const Icon = stage.icon;
                    
                    // Position adjustments for curve
                    const topOffsets = ["top-[60%]", "top-[45%]", "top-[35%]", "top-[20%]", "top-[10%]"];
                    
                    return (
                      <div 
                        key={stage.key}
                        className={`relative flex flex-col items-center ${topOffsets[index]}`}
                        style={{ transform: "translateY(-50%)" }}
                      >
                        {/* Marker Pin */}
                        <div className={`relative group cursor-pointer`}>
                          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${colors.bg} flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110`}>
                            <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                          </div>
                          {/* Pin tail */}
                          <div className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent ${colors.bg.replace('bg-', 'border-t-')}`} />
                        </div>
                        
                        {/* Label */}
                        <div className="mt-4 text-center">
                          <p className={`text-xs md:text-sm font-semibold ${colors.text}`}>
                            {stage.title}
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">
                            {isLoading ? "..." : count}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                {journeyStages.map((stage, index) => {
                  const colors = statusColors[stage.key as keyof typeof statusColors];
                  return (
                    <div key={stage.key} className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                      <span className="text-muted-foreground">{stage.title}</span>
                      {index < journeyStages.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50 hidden md:block ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {journeyStages.map((stage) => {
            const colors = statusColors[stage.key as keyof typeof statusColors];
            const Icon = stage.icon;
            
            return (
              <Card key={stage.key} className={`border-l-4 ${colors.bg.replace('bg-', 'border-l-')}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${colors.light}`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <CardTitle className="text-sm font-medium">{stage.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {stage.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Tips Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold">
              {language === "tr" ? "Müşteri Geliştirme Stratejileri" : "Customer Development Strategies"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {journeyStages.slice(0, -1).map((stage, index) => {
              const nextStage = journeyStages[index + 1];
              const colors = statusColors[stage.key as keyof typeof statusColors];
              const nextColors = statusColors[nextStage.key as keyof typeof statusColors];
              const currentCount = statusCounts[stage.key as keyof typeof statusCounts];
              
              return (
                <Card key={stage.key} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-md ${colors.light}`}>
                        <span className={`text-xs font-medium ${colors.text}`}>{stage.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <div className={`px-2 py-1 rounded-md ${nextColors.light}`}>
                        <span className={`text-xs font-medium ${nextColors.text}`}>{nextStage.title}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === "tr" 
                        ? `${currentCount} müşteriyi bir üst seviyeye taşı`
                        : `Move ${currentCount} customers to the next level`}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {stage.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 ${colors.text} flex-shrink-0`} />
                          <span className="text-sm text-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/customers?status=${encodeURIComponent(stage.key)}`)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {language === "tr" ? "Müşterileri Gör" : "View Customers"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === "tr" ? "Özet İstatistikler" : "Summary Statistics"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {journeyStages.map((stage) => {
                const colors = statusColors[stage.key as keyof typeof statusColors];
                const count = statusCounts[stage.key as keyof typeof statusCounts];
                const total = customers.length;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                
                return (
                  <div key={stage.key} className="text-center p-4 rounded-lg bg-muted/50">
                    <p className={`text-2xl font-bold ${colors.text}`}>{percentage}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{stage.title}</p>
                    <p className="text-xs text-muted-foreground">({count} {language === "tr" ? "müşteri" : "customers"})</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CustomerJourney;
