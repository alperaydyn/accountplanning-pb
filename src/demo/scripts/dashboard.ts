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
      id: "product-insight-item",
      elementSelector: "[data-demo-id='product-insights-panel'] [data-demo-id='insight-item']:first-child",
      highlightType: "pulse",
      position: "right",
      duration: 8000,
      actions: [{ type: "click", delay: 2500 }],
      content: {
        tr: {
          shortText: "Ürün Performansı Detayları",
          narrative:
            "Sol panelde ürün performansı içgörüleri yer alır. Herhangi bir içgörüye tıklayarak detaylı analiz ve önerilere ulaşabilirsiniz. Modal pencerede ürün bazlı performans verileri ve önerilen aksiyonlar görüntülenir.",
        },
        en: {
          shortText: "Product Performance Details",
          narrative:
            "The left panel contains product performance insights. Click on any insight to view detailed analysis and recommendations. The modal window shows product-based performance data and suggested actions.",
        },
        es: {
          shortText: "Detalles de Rendimiento de Productos",
          narrative:
            "El panel izquierdo contiene perspectivas de rendimiento de productos. Haga clic en cualquier perspectiva para ver análisis detallados y recomendaciones. La ventana modal muestra datos de rendimiento basados en productos y acciones sugeridas.",
        },
      },
    },
    {
      id: "product-insight-modal",
      elementSelector: "[role='dialog']",
      highlightType: "spotlight",
      position: "left",
      duration: 10000,
      waitForElement: true,
      content: {
        tr: {
          shortText: "Ürün Analiz Modalı",
          narrative:
            "Bu modal pencere seçilen ürün içgörüsünün detaylarını gösterir. Durum Analizi bölümünde mevcut performans değerlendirmesi, Önerilen Aksiyonlar bölümünde ise yapılması gereken adımlar listelenir. İlgili müşterilere doğrudan bu ekrandan ulaşabilirsiniz.",
        },
        en: {
          shortText: "Product Analysis Modal",
          narrative:
            "This modal window shows details of the selected product insight. The Status Analysis section contains the current performance assessment, while the Recommended Actions section lists the steps to be taken. You can access related customers directly from this screen.",
        },
        es: {
          shortText: "Modal de Análisis de Productos",
          narrative:
            "Esta ventana modal muestra los detalles de la perspectiva de producto seleccionada. La sección de Análisis de Estado contiene la evaluación del rendimiento actual, mientras que la sección de Acciones Recomendadas enumera los pasos a seguir. Puede acceder a los clientes relacionados directamente desde esta pantalla.",
        },
      },
    },
    {
      id: "action-insight-item",
      elementSelector: "[data-demo-id='action-insights-panel'] [data-demo-id='action-insight-item']:first-child",
      highlightType: "pulse",
      position: "left",
      duration: 8000,
      actions: [{ type: "click", delay: 2500 }],
      content: {
        tr: {
          shortText: "Aksiyon Kalitesi Detayları",
          narrative:
            "Sağ panelde aksiyon kalitesi içgörüleri yer alır. Bu panel planlanan aksiyonlarınızın yeterliliğini, hizalamasını ve dengesini analiz eder. Detaylı değerlendirme için herhangi bir kategoriye tıklayın.",
        },
        en: {
          shortText: "Action Quality Details",
          narrative:
            "The right panel contains action quality insights. This panel analyzes the sufficiency, alignment, and balance of your planned actions. Click on any category for a detailed assessment.",
        },
        es: {
          shortText: "Detalles de Calidad de Acciones",
          narrative:
            "El panel derecho contiene perspectivas de calidad de acciones. Este panel analiza la suficiencia, alineación y equilibrio de sus acciones planificadas. Haga clic en cualquier categoría para una evaluación detallada.",
        },
      },
    },
    {
      id: "action-insight-modal",
      elementSelector: "[role='dialog']",
      highlightType: "spotlight",
      position: "right",
      duration: 10000,
      waitForElement: true,
      content: {
        tr: {
          shortText: "Aksiyon Analiz Modalı",
          narrative:
            "Bu modal, aksiyon planlamanızın detaylı analizini sunar. Yeterlilik, toplam aksiyon sayınızın hedeflerle uyumunu gösterir. Hizalama, kritik ürünlere odaklanma düzeyinizi ölçer. Denge ise ana banka olmayan müşterilere verilen önceliği değerlendirir.",
        },
        en: {
          shortText: "Action Analysis Modal",
          narrative:
            "This modal presents a detailed analysis of your action planning. Sufficiency shows how your total action count aligns with targets. Alignment measures your focus on critical products. Balance evaluates the priority given to non-primary bank customers.",
        },
        es: {
          shortText: "Modal de Análisis de Acciones",
          narrative:
            "Este modal presenta un análisis detallado de su planificación de acciones. La suficiencia muestra cómo su recuento total de acciones se alinea con los objetivos. La alineación mide su enfoque en productos críticos. El equilibrio evalúa la prioridad dada a los clientes que no son de banco principal.",
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
      elementSelector: "[data-demo-id='product-table'] .overflow-auto table tbody tr:first-child",
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
