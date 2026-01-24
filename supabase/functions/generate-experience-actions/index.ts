import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KeyMoment {
  id: string;
  name: string;
  score: number;
  target: number;
  status: 'success' | 'warning' | 'critical';
}

interface Customer {
  id: string;
  name: string;
  sector: string;
  segment: string;
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyMoments, customers, recordMonth } = await req.json();

    if (!keyMoments || !customers || !recordMonth) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate recommendations based on problem key moments
    const actions: any[] = [];
    
    const keyMomentRecommendations: Record<string, string[]> = {
      'customer-visit': [
        'Müşteriyi ziyaret ederek ilişkiyi güçlendirin',
        'Ürün tanıtım toplantısı planlayın',
        'Yıllık iş planı görüşmesi yapın',
      ],
      'urgent-financial-support': [
        'Limit artışı için başvuru yapın',
        'Yeni kredi ürünleri hakkında bilgilendirin',
        'Finansal sağlık analizi sunun',
      ],
      'digital-channel': [
        'Dijital bankacılık eğitimi verin',
        'Mobil uygulama kullanımını teşvik edin',
        'Online işlem kampanyalarını tanıtın',
      ],
      'critical-payments': [
        'Otomatik ödeme talimatı oluşturun',
        'Dijital maaş ödeme sistemini tanıtın',
        'Ödeme takvimleme hizmeti sunun',
      ],
      'cash-management': [
        'EFT/Havale optimizasyonu önerin',
        'Nakit yönetimi çözümleri sunun',
        'Likidite yönetimi danışmanlığı verin',
      ],
      'quick-support': [
        'Proaktif iletişim başlatın',
        'Memnuniyet anketi yapın',
        'Şikayet takip görüşmesi gerçekleştirin',
      ],
    };

    const priorityByStatus: Record<string, 'high' | 'medium' | 'low'> = {
      'critical': 'high',
      'warning': 'medium',
      'success': 'low',
    };

    // Generate actions for each problem key moment
    for (const km of keyMoments as KeyMoment[]) {
      if (km.status === 'success') continue;

      const recommendations = keyMomentRecommendations[km.id] || [];
      const selectedCustomers = (customers as Customer[])
        .filter(c => c.status === 'Aktif' || c.status === 'Target')
        .slice(0, 3);

      for (const customer of selectedCustomers) {
        const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
        if (recommendation) {
          actions.push({
            customer_id: customer.id,
            key_moment: km.name,
            recommendation: `${customer.name}: ${recommendation}`,
            priority: priorityByStatus[km.status],
            ai_reasoning: `${km.name} skoru ${km.score}% (hedef: ${km.target}%). Bu müşteri için iyileştirme potansiyeli yüksek.`,
          });
        }
      }
    }

    // Limit to 10 actions
    const limitedActions = actions.slice(0, 10);

    return new Response(
      JSON.stringify({ actions: limitedActions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating experience actions:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
