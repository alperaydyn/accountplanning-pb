import { DemoScript } from "../types";

export const dashboardDemoScript: DemoScript = {
  id: "dashboard-demo",
  page: "/",
  title: {
    tr: "Dashboard Turu",
    en: "Dashboard Tour",
    es: "Tour del Panel",
  },
  description: {
    tr: "Portföy panelinizi ve temel özelliklerini keşfedin",
    en: "Discover your portfolio dashboard and its key features",
    es: "Descubre tu panel de cartera y sus características principales",
  },
  steps: [
    {
      id: "welcome",
      elementSelector: "[data-demo-id='page-header']",
      highlightType: "spotlight",
      position: "bottom",
      duration: 8000,
      content: {
        tr: {
          shortText: "Portföy Panelinize Hoş Geldiniz",
          narrative:
            "Portföy Panelinize hoş geldiniz. Bu, tüm müşteri portföyünüzü tek bir bakışta izleyebileceğiniz merkezi komut merkezinizdir. Her bölümü birlikte keşfedelim.",
        },
        en: {
          shortText: "Welcome to Your Portfolio Dashboard",
          narrative:
            "Welcome to your Portfolio Dashboard. This is your central command center where you can monitor your entire customer portfolio at a glance. Let's explore each section together.",
        },
        es: {
          shortText: "Bienvenido a su Panel de Cartera",
          narrative:
            "Bienvenido a su Panel de Cartera. Este es su centro de comando central donde puede monitorear toda su cartera de clientes de un vistazo. Exploremos cada sección juntos.",
        },
      },
    },
    {
      id: "date-selector",
      elementSelector: "[data-demo-id='date-selector']",
      highlightType: "pulse",
      position: "bottom",
      duration: 7000,
      actions: [{ type: "click", delay: 2000 }],
      content: {
        tr: {
          shortText: "Raporlama Dönemini Seçin",
          narrative:
            "Tarih seçici, raporlama dönemini seçmenizi sağlar. Güncel verileri veya ilerlemeyi takip etmek için geçmiş anlık görüntüleri görüntüleyebilirsiniz.",
        },
        en: {
          shortText: "Select Reporting Period",
          narrative:
            "The date selector allows you to choose the reporting period. You can view current data or historical snapshots to track progress over time.",
        },
        es: {
          shortText: "Seleccione el Período de Informe",
          narrative:
            "El selector de fecha le permite elegir el período de informe. Puede ver datos actuales o instantáneas históricas para seguir el progreso a lo largo del tiempo.",
        },
      },
    },
    {
      id: "summary-cards",
      elementSelector: "[data-demo-id='summary-cards']",
      highlightType: "spotlight",
      position: "bottom",
      duration: 8000,
      content: {
        tr: {
          shortText: "Temel Performans Göstergeleri",
          narrative:
            "Bu özet kartları temel performans göstergelerinizi gösterir: toplam müşteri sayısı, ana banka puanı, benchmark performansı ve bekleyen aksiyonlar.",
        },
        en: {
          shortText: "Key Performance Indicators",
          narrative:
            "These summary cards show your key performance indicators: total customers, primary bank score, benchmark performance, and pending actions.",
        },
        es: {
          shortText: "Indicadores Clave de Rendimiento",
          narrative:
            "Estas tarjetas de resumen muestran sus indicadores clave de rendimiento: clientes totales, puntuación de banco principal, rendimiento de referencia y acciones pendientes.",
        },
      },
    },
    {
      id: "primary-bank-score",
      elementSelector: "[data-demo-id='primary-bank-score']",
      highlightType: "border",
      position: "right",
      duration: 10000,
      actions: [{ type: "click", delay: 3000 }],
      content: {
        tr: {
          shortText: "Ana Banka Puanı",
          narrative:
            "Ana Banka Puanı, müşterilerinizin yüzde kaçının sizi ana bankacılık ortağı olarak gördüğünü gösterir. Detaylı döküm için tıklayabilirsiniz. Bu modal hem krediler ve POS gibi dış ürün puanlarını hem de mevduat ve yatırımlar gibi iç ürün puanlarını gösterir.",
        },
        en: {
          shortText: "Primary Bank Score",
          narrative:
            "The Primary Bank Score shows what percentage of your customers consider you their main banking partner. Click to see a detailed breakdown. This modal shows both external product scores like loans and POS, and internal product scores like deposits and investments.",
        },
        es: {
          shortText: "Puntuación de Banco Principal",
          narrative:
            "La Puntuación de Banco Principal muestra qué porcentaje de sus clientes lo consideran su principal socio bancario. Haga clic para ver un desglose detallado. Este modal muestra tanto las puntuaciones de productos externos como préstamos y POS, como las puntuaciones de productos internos como depósitos e inversiones.",
        },
      },
    },
    {
      id: "benchmark-score",
      elementSelector: "[data-demo-id='benchmark-score']",
      highlightType: "border",
      position: "left",
      duration: 7000,
      content: {
        tr: {
          shortText: "Benchmark Karşılaştırması",
          narrative:
            "Benchmark puanı, performansınızı diğer portföy yöneticileriyle karşılaştırmanızı sağlar. Bu, güçlü yönlerinizi ve gelişim alanlarınızı belirlemenize yardımcı olur.",
        },
        en: {
          shortText: "Benchmark Comparison",
          narrative:
            "The benchmark score allows you to compare your performance with other portfolio managers. This helps you identify your strengths and areas for improvement.",
        },
        es: {
          shortText: "Comparación de Referencia",
          narrative:
            "La puntuación de referencia le permite comparar su rendimiento con otros gestores de cartera. Esto le ayuda a identificar sus fortalezas y áreas de mejora.",
        },
      },
    },
    {
      id: "insights-panel",
      elementSelector: "[data-demo-id='insights-panel']",
      highlightType: "spotlight",
      position: "top",
      duration: 9000,
      actions: [{ type: "scroll", delay: 500 }],
      content: {
        tr: {
          shortText: "Yapay Zeka Destekli Öneriler",
          narrative:
            "Yapay Zeka Önerileri Paneli portföyünüzü analiz eder ve uygulanabilir öneriler sunar. Bu öneriler performans verilerinize göre otomatik olarak oluşturulur ve size stratejik rehberlik sağlar.",
        },
        en: {
          shortText: "AI-Powered Insights",
          narrative:
            "The AI Insights Panel analyzes your portfolio and provides actionable recommendations. These insights are automatically generated based on your performance data, giving you strategic guidance.",
        },
        es: {
          shortText: "Perspectivas Impulsadas por IA",
          narrative:
            "El Panel de Perspectivas de IA analiza su cartera y proporciona recomendaciones accionables. Estas perspectivas se generan automáticamente basándose en sus datos de rendimiento, brindándole orientación estratégica.",
        },
      },
    },
    {
      id: "product-table",
      elementSelector: "[data-demo-id='product-table']",
      highlightType: "spotlight",
      position: "top",
      duration: 10000,
      actions: [{ type: "scroll", delay: 500 }],
      content: {
        tr: {
          shortText: "Ürün Performans Tablosu",
          narrative:
            "Ürün Performans Tablosu, her ürün kategorisi için stok ve akış verileri, hedefler ve durum göstergeleri dahil olmak üzere detaylı metrikleri gösterir. Satırları genişleterek daha fazla detay görebilirsiniz.",
        },
        en: {
          shortText: "Product Performance Table",
          narrative:
            "The Product Performance table shows detailed metrics for each product category including stock and flow data, targets, and status indicators. You can expand rows to see more details.",
        },
        es: {
          shortText: "Tabla de Rendimiento de Productos",
          narrative:
            "La tabla de Rendimiento de Productos muestra métricas detalladas para cada categoría de producto, incluyendo datos de stock y flujo, objetivos e indicadores de estado. Puede expandir las filas para ver más detalles.",
        },
      },
    },
    {
      id: "status-indicators",
      elementSelector: "[data-demo-id='product-table'] tbody tr:first-child",
      highlightType: "pulse",
      position: "top",
      duration: 8000,
      content: {
        tr: {
          shortText: "Durum Göstergeleri",
          narrative:
            "Renk kodlu durum göstergeleri, hangi ürünlerin hedefte olduğunu, hangilerinin risk altında olduğunu veya acil müdahale gerektirdiğini hızlıca belirlemenize yardımcı olur. Yeşil yolda, sarı dikkat gerektiriyor, kırmızı kritik demektir.",
        },
        en: {
          shortText: "Status Indicators",
          narrative:
            "Color-coded status indicators help you quickly identify which products are on track, at risk, or need immediate attention. Green means on track, yellow requires attention, red is critical.",
        },
        es: {
          shortText: "Indicadores de Estado",
          narrative:
            "Los indicadores de estado codificados por colores le ayudan a identificar rápidamente qué productos están en camino, en riesgo o necesitan atención inmediata. Verde significa en camino, amarillo requiere atención, rojo es crítico.",
        },
      },
    },
  ],
};
