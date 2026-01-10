export type Language = "tr" | "en" | "es";

export interface Translations {
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    ok: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    actions: string;
    status: string;
    date: string;
    today: string;
    noData: string;
    unknown: string;
    more: string;
    showing: string;
    of: string;
  };

  // Auth
  auth: {
    accountPlanning: string;
    accountPlanningDescription: string;
    login: string;
    signup: string;
    logout: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    loggingIn: string;
    signingUp: string;
    termsAgreement: string;
    fillAllFields: string;
    passwordsNotMatch: string;
    passwordMinLength: string;
    invalidCredentials: string;
    emailAlreadyRegistered: string;
    loginSuccess: string;
    signupSuccess: string;
  };

  // Navigation & Layout
  nav: {
    dashboard: string;
    primaryBank: string;
    customers: string;
    actionsAgenda: string;
    aiAssistant: string;
    thresholds: string;
    settings: string;
    mainMenu: string;
    system: string;
    searchPlaceholder: string;
  };

  // Dashboard
  dashboard: {
    portfolioDashboard: string;
    welcomeBack: string;
    portfolioOverview: string;
    selectDate: string;
    totalCustomers: string;
    scaleUpEnterprise: string;
    activeCustomers: string;
    totalVolume: string;
    pendingActions: string;
    createRecords: string;
    productPerformance: string;
    aiInsights: string;
    generateInsights: string;
    regenerateInsights: string;
    noInsightsYet: string;
    insightsDescription: string;
    primaryBankScore: string;
    benchmarkScore: string;
    primary: string;
    target: string;
    rest: string;
    planned: string;
    completed: string;
    pending: string;
    customers: string;
    primaryBank: string;
    externalProducts: string;
    internalProducts: string;
    scoreBreakdown: string;
    scoreExplanation: string;
    onTrack: string;
    atRisk: string;
    critical: string;
    melting: string;
    growing: string;
    ticketSize: string;
    diversity: string;
    relatedProducts: string;
    viewCustomers: string;
    noDataAvailable: string;
    type: string;
    stock: string;
    flow: string;
    customerCount: string;
    volume: string;
    hgo: string;
    ytd: string;
    mtd: string;
    retry: string;
    analyzing: string;
    failedToLoad: string;
  };

  // Customers
  customers: {
    title: string;
    description: string;
    searchPlaceholder: string;
    newCustomer: string;
    generateCustomer: string;
    noCustomers: string;
    noCustomersDescription: string;
    customerName: string;
    group: string;
    sector: string;
    segment: string;
    products: string;
    principality: string;
    lastActivity: string;
    customerDetail: string;
    customerSummary: string;
    customerProducts: string;
    customerActions: string;
    autopilot: string;
    addAction: string;
    allGroups: string;
    allSectors: string;
    allSegments: string;
    allStatuses: string;
    allProducts: string;
    hasActions: string;
    noActions: string;
  };

  // Actions
  actions: {
    title: string;
    description: string;
    planned: string;
    pending: string;
    completed: string;
    postponed: string;
    notInterested: string;
    notPossible: string;
    highPriority: string;
    mediumPriority: string;
    lowPriority: string;
    noActionsPlanned: string;
    noActionsDay: string;
    noActionsWeek: string;
    noActionsMonth: string;
    letAIFind: string;
    actionsInView: string;
    allPlannedPending: string;
    plannedActions: string;
    pendingActions: string;
    daily: string;
    weekly: string;
    monthly: string;
    list: string;
    noActionsFound: string;
    planDay: string;
    preferredView: string;
    preferredViewDescription: string;
    priority: string;
    status: string;
    action: string;
    customer: string;
    product: string;
    date: string;
  };

  // Settings
  settings: {
    title: string;
    description: string;
    language: string;
    languageDescription: string;
    documentation: string;
    documentationDescription: string;
    viewDocumentation: string;
    theme: string;
    themeDescription: string;
    notifications: string;
    notificationsDescription: string;
    projectDocumentation: string;
    backToSettings: string;
  };

  // Thresholds
  thresholds: {
    title: string;
    description: string;
    product: string;
    thresholdValue: string;
    version: string;
    calculationDate: string;
    active: string;
    inactive: string;
    adminRequired: string;
    noThresholds: string;
    editThreshold: string;
    saveThreshold: string;
  };

  // AI Assistant
  ai: {
    title: string;
    description: string;
    newChat: string;
    typeMessage: string;
    send: string;
    thinking: string;
    chatHistory: string;
    noPreviousChats: string;
    deleteChat: string;
    welcomeMessage: string;
    startNewChat: string;
    privacyNotice: string;
    privacyDetail1: string;
    privacyDetail2: string;
    privacyDetail3: string;
    privacyDetail4: string;
    communicationError: string;
    planMyDay: string;
  };

  // Customer Detail
  customerDetail: {
    principalityScore: string;
    customerNotFound: string;
    generateActions: string;
    generatingActions: string;
    actionsGenerated: string;
    noActionsGenerated: string;
    actionGenerationFailed: string;
    gap: string;
    threshold: string;
    currentValue: string;
    owned: string;
    notOwned: string;
    actionFor: string;
    priority: string;
    high: string;
    medium: string;
    low: string;
  };

  // NotFound
  notFound: {
    title: string;
    message: string;
    returnHome: string;
  };

  // Languages
  languages: {
    turkish: string;
    english: string;
    spanish: string;
  };

  // Status labels (Turkish enum values)
  statusLabels: {
    Beklemede: string;
    Planlandı: string;
    Tamamlandı: string;
    Ertelendi: string;
    İlgilenmiyor: string;
    "Uygun Değil": string;
  };

  // Customer status labels
  customerStatusLabels: {
    "Yeni Müşteri": string;
    Aktif: string;
    Target: string;
    "Strong Target": string;
    "Ana Banka": string;
  };

  // Sector labels
  sectorLabels: {
    Turizm: string;
    Ulaşım: string;
    Perakende: string;
    Gayrimenkul: string;
    "Tarım Hayvancılık": string;
    Sağlık: string;
    Enerji: string;
  };

  // Segment labels
  segmentLabels: {
    MİKRO: string;
    Kİ: string;
    OBİ: string;
    TİCARİ: string;
  };

  // Product categories
  categoryLabels: {
    Kredi: string;
    Kaynak: string;
    Ödeme: string;
    Tahsilat: string;
    Sigorta: string;
    İştirak: string;
  };

  // Calendar
  calendar: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
}

export const translations: Record<Language, Translations> = {
  tr: {
    common: {
      loading: "Yükleniyor...",
      save: "Kaydet",
      cancel: "İptal",
      delete: "Sil",
      edit: "Düzenle",
      add: "Ekle",
      search: "Ara",
      filter: "Filtrele",
      all: "Tümü",
      none: "Hiçbiri",
      yes: "Evet",
      no: "Hayır",
      ok: "Tamam",
      close: "Kapat",
      back: "Geri",
      next: "İleri",
      previous: "Önceki",
      actions: "Aksiyonlar",
      status: "Durum",
      date: "Tarih",
      today: "Bugün",
      noData: "Veri bulunamadı",
      unknown: "Bilinmiyor",
      more: "daha fazla",
      showing: "Gösterilen",
      of: "/",
    },
    auth: {
      accountPlanning: "Account Planning",
      accountPlanningDescription: "Hesap planlaması yönetim sistemi",
      login: "Giriş Yap",
      signup: "Kayıt Ol",
      logout: "Çıkış Yap",
      email: "E-posta",
      password: "Şifre",
      confirmPassword: "Şifre Tekrar",
      fullName: "Ad Soyad",
      loggingIn: "Giriş yapılıyor...",
      signingUp: "Kayıt yapılıyor...",
      termsAgreement: "Devam ederek kullanım şartlarını kabul etmiş olursunuz.",
      fillAllFields: "Lütfen tüm alanları doldurun",
      passwordsNotMatch: "Şifreler eşleşmiyor",
      passwordMinLength: "Şifre en az 6 karakter olmalıdır",
      invalidCredentials: "Geçersiz e-posta veya şifre",
      emailAlreadyRegistered: "Bu e-posta adresi zaten kayıtlı",
      loginSuccess: "Giriş başarılı!",
      signupSuccess: "Kayıt başarılı! Giriş yapılıyor...",
    },
    nav: {
      dashboard: "Dashboard",
      primaryBank: "Ana Banka",
      customers: "Müşteriler",
      actionsAgenda: "Aksiyon Takvimi",
      aiAssistant: "AI Asistan",
      thresholds: "Eşik Değerleri",
      settings: "Ayarlar",
      mainMenu: "Ana Menü",
      system: "Sistem",
      searchPlaceholder: "Müşteri, aksiyon ara...",
    },
    dashboard: {
      portfolioDashboard: "Portföy Dashboard",
      welcomeBack: "Tekrar hoş geldiniz",
      portfolioOverview: "Portföy genel bakışınız.",
      selectDate: "Tarih seçin",
      totalCustomers: "Toplam Müşteri",
      scaleUpEnterprise: "Scale Up Enterprise",
      activeCustomers: "Aktif Müşteri",
      totalVolume: "Toplam Hacim",
      pendingActions: "Bekleyen Aksiyonlar",
      createRecords: "Kayıt Oluştur",
      productPerformance: "Ürün Performansı",
      aiInsights: "AI İçgörüleri",
      generateInsights: "İçgörü Oluştur",
      regenerateInsights: "Yeniden Oluştur",
      noInsightsYet: "Henüz içgörü yok",
      insightsDescription: "AI içgörüleri oluşturmak için butona tıklayın.",
      primaryBankScore: "Ana Banka Skoru",
      benchmarkScore: "Benchmark Skoru",
      primary: "Ana Banka",
      target: "Hedef",
      rest: "Diğer",
      planned: "Planlı",
      completed: "Tamamlanan",
      pending: "Bekleyen",
      customers: "Müşteri",
      primaryBank: "Ana Banka",
      externalProducts: "Harici Ürünler",
      internalProducts: "Dahili Ürünler",
      scoreBreakdown: "Portföy Prensiplik Skor Dağılımı",
      scoreExplanation:
        "Ana Banka Skoru, müşterilerinizin bankamızla olan ilişkisinin derinliğini dört ana eksende ölçer.",
      onTrack: "Yolunda",
      atRisk: "Riskli",
      critical: "Kritik",
      melting: "Eriyen",
      growing: "Büyüyen",
      ticketSize: "Bilet Büyüklüğü ⚠",
      diversity: "Çeşitlilik ⚠",
      relatedProducts: "İlgili Ürünler",
      viewCustomers: "Müşterileri Gör",
      noDataAvailable: 'Veri mevcut değil. Hedefleri başlatmak için "Kayıt Oluştur" butonuna tıklayın.',
      type: "Tip",
      stock: "Stok",
      flow: "Akış",
      customerCount: "Müşteri Sayısı",
      volume: "Hacim",
      hgo: "HGO",
      ytd: "YBB",
      mtd: "ABB",
      retry: "Tekrar Dene",
      analyzing: "AI ürün performansını analiz ediyor",
      failedToLoad: "İçgörüler yüklenemedi. Lütfen daha sonra tekrar deneyin.",
    },
    customers: {
      title: "Müşteriler",
      description: "Müşteri portföyünüzü yönetin",
      searchPlaceholder: "Müşteri adı ara...",
      newCustomer: "Yeni Müşteri",
      generateCustomer: "Müşteri Oluştur",
      noCustomers: "Müşteri bulunamadı",
      noCustomersDescription: "Filtrelere uygun müşteri bulunamadı.",
      customerName: "Müşteri Adı",
      group: "Grup",
      sector: "Sektör",
      segment: "Segment",
      products: "Ürünler",
      principality: "Prensiplik",
      lastActivity: "Son Aktivite",
      customerDetail: "Müşteri Detayı",
      customerSummary: "Müşteri Özeti",
      customerProducts: "Müşteri Ürünleri",
      customerActions: "Müşteri Aksiyonları",
      autopilot: "AutoPilot",
      addAction: "Aksiyon Ekle",
      allGroups: "Tüm Gruplar",
      allSectors: "Tüm Sektörler",
      allSegments: "Tüm Segmentler",
      allStatuses: "Tüm Durumlar",
      allProducts: "Tüm Ürünler",
      hasActions: "Aksiyonlu",
      noActions: "Aksiyonsuz",
    },
    actions: {
      title: "Aksiyon Takvimi",
      description: "Planlanmış ve bekleyen aksiyonlarınız",
      planned: "Planlandı",
      pending: "Beklemede",
      completed: "Tamamlandı",
      postponed: "Ertelendi",
      notInterested: "İlgilenmiyor",
      notPossible: "Uygun Değil",
      highPriority: "Yüksek Öncelik",
      mediumPriority: "Orta Öncelik",
      lowPriority: "Düşük Öncelik",
      noActionsPlanned: "Planlanmış aksiyon yok",
      noActionsDay: "Bu gün için planlanmış aksiyon yok.",
      noActionsWeek: "Bu hafta için planlanmış aksiyon yok.",
      noActionsMonth: "Bu ay için planlanmış aksiyon yok.",
      letAIFind: "AI size en iyi müşterileri bulsun",
      actionsInView: "görünümde aksiyon",
      allPlannedPending: "Tüm planlı ve bekleyen aksiyonlar",
      plannedActions: "Planlı aksiyonlar",
      pendingActions: "Bekleyen aksiyonlar",
      daily: "Günlük",
      weekly: "Haftalık",
      monthly: "Aylık",
      list: "Liste",
      noActionsFound: "Aksiyon bulunamadı",
      planDay: "Planla",
      preferredView: "Tercih Edilen Görünüm",
      preferredViewDescription: "Aksiyon takvimi için varsayılan görünümü seçin",
      priority: "Öncelik",
      status: "Durum",
      action: "Aksiyon",
      customer: "Müşteri",
      product: "Ürün",
      date: "Tarih",
    },
    settings: {
      title: "Ayarlar",
      description: "Uygulama ayarlarını yönetin",
      language: "Dil",
      languageDescription: "Uygulama dilini seçin",
      documentation: "Dokümantasyon",
      documentationDescription: "Proje README dosyasını görüntüleyin",
      viewDocumentation: "Dokümantasyonu Görüntüle",
      theme: "Tema",
      themeDescription: "Uygulama temasını seçin",
      notifications: "Bildirimler",
      notificationsDescription: "Bildirim tercihlerini yönetin",
      projectDocumentation: "Proje Dokümantasyonu",
      backToSettings: "Ayarlara Dön",
    },
    thresholds: {
      title: "Eşik Değerleri",
      description: "Ürün eşik değerlerini yönetin",
      product: "Ürün",
      thresholdValue: "Eşik Değeri",
      version: "Versiyon",
      calculationDate: "Hesaplama Tarihi",
      active: "Aktif",
      inactive: "Pasif",
      adminRequired: "Eşik değerlerini düzenlemek için admin yetkisi gereklidir.",
      noThresholds: "Eşik değeri bulunamadı",
      editThreshold: "Eşik Değerini Düzenle",
      saveThreshold: "Eşik Değerini Kaydet",
    },
    ai: {
      title: "AI Asistan",
      description: "Portföyünüz hakkında sorular sorun",
      newChat: "Yeni Sohbet",
      typeMessage: "Mesajınızı yazın...",
      send: "Gönder",
      thinking: "Düşünüyor...",
      chatHistory: "Sohbet Geçmişi",
      noPreviousChats: "Önceki sohbet bulunamadı",
      deleteChat: "Sohbeti Sil",
      welcomeMessage: "Merhaba! Bugün hangi müşterilere odaklanmanız gerektiğini bulmanıza yardımcı olabilirim.",
      startNewChat: "Yeni sohbet başlat",
      privacyNotice: "Müşteri kimlikleriniz korunmaktadır",
      privacyDetail1: "Müşteri isimleri doğrudan AI ile paylaşılmaz",
      privacyDetail2: "Her oturum için algılanamaz tek seferlik ID'ler oluşturulur",
      privacyDetail3: "Gelen ID'ler tarayıcı oturumunuzda müşterilere eşlenir",
      privacyDetail4: "Notlardaki hassas bilgiler prompt gönderilmeden önce maskelenir",
      communicationError: "AI asistanla iletişim kurulamadı",
      planMyDay: "Günümü Planla",
    },
    customerDetail: {
      principalityScore: "Prensiplik Skoru",
      customerNotFound: "Müşteri bulunamadı",
      generateActions: "Aksiyon Oluştur",
      generatingActions: "Aksiyon oluşturuluyor...",
      actionsGenerated: "aksiyon başarıyla oluşturuldu",
      noActionsGenerated: "Bu müşteri için aksiyon oluşturulmadı",
      actionGenerationFailed: "Aksiyon oluşturulamadı",
      gap: "Fark",
      threshold: "Eşik",
      currentValue: "Mevcut Değer",
      owned: "Sahip",
      notOwned: "Sahip Değil",
      actionFor: "için aksiyon",
      priority: "Öncelik",
      high: "Yüksek",
      medium: "Orta",
      low: "Düşük",
    },
    notFound: {
      title: "404",
      message: "Sayfa bulunamadı",
      returnHome: "Ana Sayfaya Dön",
    },
    languages: {
      turkish: "Türkçe",
      english: "English",
      spanish: "Español",
    },
    statusLabels: {
      Beklemede: "Beklemede",
      Planlandı: "Planlandı",
      Tamamlandı: "Tamamlandı",
      Ertelendi: "Ertelendi",
      İlgilenmiyor: "İlgilenmiyor",
      "Uygun Değil": "Uygun Değil",
    },
    customerStatusLabels: {
      "Yeni Müşteri": "Yeni Müşteri",
      Aktif: "Aktif",
      Target: "Target",
      "Strong Target": "Strong Target",
      "Ana Banka": "Ana Banka",
    },
    sectorLabels: {
      Turizm: "Turizm",
      Ulaşım: "Ulaşım",
      Perakende: "Perakende",
      Gayrimenkul: "Gayrimenkul",
      "Tarım Hayvancılık": "Tarım Hayvancılık",
      Sağlık: "Sağlık",
      Enerji: "Enerji",
    },
    segmentLabels: {
      MİKRO: "Mikro",
      Kİ: "Küçük İşletme",
      OBİ: "Orta Ölçekli",
      TİCARİ: "Ticari",
    },
    categoryLabels: {
      Kredi: "Kredi",
      Kaynak: "Kaynak",
      Ödeme: "Ödeme",
      Tahsilat: "Tahsilat",
      Sigorta: "Sigorta",
      İştirak: "İştirak",
    },
    calendar: {
      mon: "Pzt",
      tue: "Sal",
      wed: "Çar",
      thu: "Per",
      fri: "Cum",
      sat: "Cmt",
      sun: "Paz",
    },
  },
  en: {
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      all: "All",
      none: "None",
      yes: "Yes",
      no: "No",
      ok: "OK",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      actions: "Actions",
      status: "Status",
      date: "Date",
      today: "Today",
      noData: "No data found",
      unknown: "Unknown",
      more: "more",
      showing: "Showing",
      of: "of",
    },
    auth: {
      accountPlanning: "Account Planning",
      accountPlanningDescription: "Account planning management system",
      login: "Login",
      signup: "Sign Up",
      logout: "Logout",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      fullName: "Full Name",
      loggingIn: "Logging in...",
      signingUp: "Signing up...",
      termsAgreement: "By continuing, you agree to the terms of use.",
      fillAllFields: "Please fill in all fields",
      passwordsNotMatch: "Passwords do not match",
      passwordMinLength: "Password must be at least 6 characters",
      invalidCredentials: "Invalid email or password",
      emailAlreadyRegistered: "This email is already registered",
      loginSuccess: "Login successful!",
      signupSuccess: "Registration successful! Logging in...",
    },
    nav: {
      dashboard: "Dashboard",
      primaryBank: "Primary Bank",
      customers: "Customers",
      actionsAgenda: "Actions Agenda",
      aiAssistant: "AI Assistant",
      thresholds: "Thresholds",
      settings: "Settings",
      mainMenu: "Main Menu",
      system: "System",
      searchPlaceholder: "Search customers, actions...",
    },
    dashboard: {
      portfolioDashboard: "Portfolio Dashboard",
      welcomeBack: "Welcome back",
      portfolioOverview: "Your portfolio overview.",
      selectDate: "Select date",
      totalCustomers: "Total Customers",
      scaleUpEnterprise: "Scale Up Enterprise",
      activeCustomers: "Active Customers",
      totalVolume: "Total Volume",
      pendingActions: "Pending Actions",
      createRecords: "Create Records",
      productPerformance: "Product Performance",
      aiInsights: "AI Insights",
      generateInsights: "Generate Insights",
      regenerateInsights: "Regenerate",
      noInsightsYet: "No insights yet",
      insightsDescription: "Click the button to generate AI insights.",
      primaryBankScore: "Primary Bank Score",
      benchmarkScore: "Benchmark Score",
      primary: "Primary",
      target: "Target",
      rest: "Rest",
      planned: "Planned",
      completed: "Completed",
      pending: "Pending",
      customers: "Customers",
      primaryBank: "Primary Bank",
      externalProducts: "External Products",
      internalProducts: "Internal Products",
      scoreBreakdown: "Portfolio Principality Score Breakdown",
      scoreExplanation:
        "The Primary Bank Score measures how much of your customers' banking relationships are concentrated at our bank across four key axes.",
      onTrack: "On Track",
      atRisk: "At Risk",
      critical: "Critical",
      melting: "Melting",
      growing: "Growing",
      ticketSize: "Ticket Size ⚠",
      diversity: "Diversity ⚠",
      relatedProducts: "Related Products",
      viewCustomers: "View Customers",
      noDataAvailable: 'No data available. Click "Create Records" to initialize targets.',
      type: "Type",
      stock: "Stock",
      flow: "Flow",
      customerCount: "Customer Count",
      volume: "Volume",
      hgo: "HGO",
      ytd: "YTD",
      mtd: "MTD",
      retry: "Retry",
      analyzing: "AI is analyzing product performance",
      failedToLoad: "Failed to load insights. Please try again later.",
    },
    customers: {
      title: "Customers",
      description: "Manage your customer portfolio",
      searchPlaceholder: "Search customer name...",
      newCustomer: "New Customer",
      generateCustomer: "Generate Customer",
      noCustomers: "No customers found",
      noCustomersDescription: "No customers match the selected filters.",
      customerName: "Customer Name",
      group: "Group",
      sector: "Sector",
      segment: "Segment",
      products: "Products",
      principality: "Principality",
      lastActivity: "Last Activity",
      customerDetail: "Customer Detail",
      customerSummary: "Customer Summary",
      customerProducts: "Customer Products",
      customerActions: "Customer Actions",
      autopilot: "AutoPilot",
      addAction: "Add Action",
      allGroups: "All Groups",
      allSectors: "All Sectors",
      allSegments: "All Segments",
      allStatuses: "All Statuses",
      allProducts: "All Products",
      hasActions: "Has Actions",
      noActions: "No Actions",
    },
    actions: {
      title: "Actions Agenda",
      description: "Your planned and pending actions",
      planned: "Planned",
      pending: "Pending",
      completed: "Completed",
      postponed: "Postponed",
      notInterested: "Not Interested",
      notPossible: "Not Possible",
      highPriority: "High Priority",
      mediumPriority: "Medium Priority",
      lowPriority: "Low Priority",
      noActionsPlanned: "No actions planned",
      noActionsDay: "You don't have any actions planned for this day.",
      noActionsWeek: "You don't have any actions planned for this week.",
      noActionsMonth: "You don't have any actions planned for this month.",
      letAIFind: "Let AI find the best customers for you",
      actionsInView: "actions in view",
      allPlannedPending: "All planned & pending actions",
      plannedActions: "Planned actions",
      pendingActions: "Pending actions",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      list: "List",
      noActionsFound: "No actions found",
      planDay: "Plan",
      preferredView: "Preferred View",
      preferredViewDescription: "Select default view for actions agenda",
      priority: "Priority",
      status: "Status",
      action: "Action",
      customer: "Customer",
      product: "Product",
      date: "Date",
    },
    settings: {
      title: "Settings",
      description: "Manage application settings",
      language: "Language",
      languageDescription: "Select application language",
      documentation: "Documentation",
      documentationDescription: "View project README file",
      viewDocumentation: "View Documentation",
      theme: "Theme",
      themeDescription: "Select application theme",
      notifications: "Notifications",
      notificationsDescription: "Manage notification preferences",
      projectDocumentation: "Project Documentation",
      backToSettings: "Back to Settings",
    },
    thresholds: {
      title: "Thresholds",
      description: "Manage product thresholds",
      product: "Product",
      thresholdValue: "Threshold Value",
      version: "Version",
      calculationDate: "Calculation Date",
      active: "Active",
      inactive: "Inactive",
      adminRequired: "Admin privileges required to edit thresholds.",
      noThresholds: "No thresholds found",
      editThreshold: "Edit Threshold",
      saveThreshold: "Save Threshold",
    },
    ai: {
      title: "AI Assistant",
      description: "Ask questions about your portfolio",
      newChat: "New Chat",
      typeMessage: "Type your message...",
      send: "Send",
      thinking: "Thinking...",
      chatHistory: "Chat History",
      noPreviousChats: "No previous chats found",
      deleteChat: "Delete Chat",
      welcomeMessage: "Hello! I can help you find which customers to focus on today.",
      startNewChat: "Start new chat",
      privacyNotice: "Your customer identities are preserved",
      privacyDetail1: "Customer names are not directly shared with the AI",
      privacyDetail2: "Undetectable one-time IDs are generated for each session separately",
      privacyDetail3: "Incoming IDs are mapped to customers inside your browser session",
      privacyDetail4: "Sensitive information in notes is masked before sending the prompt",
      communicationError: "Failed to communicate with AI assistant",
      planMyDay: "Plan My Day",
    },
    customerDetail: {
      principalityScore: "Principality Score",
      customerNotFound: "Customer not found",
      generateActions: "Generate Actions",
      generatingActions: "Generating actions...",
      actionsGenerated: "actions generated successfully",
      noActionsGenerated: "No actions were generated for this customer",
      actionGenerationFailed: "Failed to generate actions",
      gap: "Gap",
      threshold: "Threshold",
      currentValue: "Current Value",
      owned: "Owned",
      notOwned: "Not Owned",
      actionFor: "action for",
      priority: "Priority",
      high: "High",
      medium: "Medium",
      low: "Low",
    },
    notFound: {
      title: "404",
      message: "Page not found",
      returnHome: "Return to Home",
    },
    languages: {
      turkish: "Türkçe",
      english: "English",
      spanish: "Español",
    },
    statusLabels: {
      Beklemede: "Pending",
      Planlandı: "Planned",
      Tamamlandı: "Completed",
      Ertelendi: "Postponed",
      İlgilenmiyor: "Not Interested",
      "Uygun Değil": "Not Possible",
    },
    customerStatusLabels: {
      "Yeni Müşteri": "New Customer",
      Aktif: "Active",
      Target: "Target",
      "Strong Target": "Strong Target",
      "Ana Banka": "Principality",
    },
    sectorLabels: {
      Turizm: "Tourism",
      Ulaşım: "Transportation",
      Perakende: "Retail",
      Gayrimenkul: "Real Estate",
      "Tarım Hayvancılık": "Agriculture",
      Sağlık: "Healthcare",
      Enerji: "Energy",
    },
    segmentLabels: {
      MİKRO: "Micro",
      Kİ: "Small Business",
      OBİ: "Mid-sized",
      TİCARİ: "Commercial",
    },
    categoryLabels: {
      Kredi: "Credit",
      Kaynak: "Funding",
      Ödeme: "Payments",
      Tahsilat: "Collections",
      Sigorta: "Insurance",
      İştirak: "Participation",
    },
    calendar: {
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun",
    },
  },
  es: {
    common: {
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      add: "Agregar",
      search: "Buscar",
      filter: "Filtrar",
      all: "Todos",
      none: "Ninguno",
      yes: "Sí",
      no: "No",
      ok: "OK",
      close: "Cerrar",
      back: "Atrás",
      next: "Siguiente",
      previous: "Anterior",
      actions: "Acciones",
      status: "Estado",
      date: "Fecha",
      today: "Hoy",
      noData: "No se encontraron datos",
      unknown: "Desconocido",
      more: "más",
      showing: "Mostrando",
      of: "de",
    },
    auth: {
      accountPlanning: "Account Planning",
      accountPlanningDescription: "Sistema de gestión de planificación de cuentas",
      login: "Iniciar Sesión",
      signup: "Registrarse",
      logout: "Cerrar Sesión",
      email: "Correo electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar Contraseña",
      fullName: "Nombre Completo",
      loggingIn: "Iniciando sesión...",
      signingUp: "Registrando...",
      termsAgreement: "Al continuar, acepta los términos de uso.",
      fillAllFields: "Por favor complete todos los campos",
      passwordsNotMatch: "Las contraseñas no coinciden",
      passwordMinLength: "La contraseña debe tener al menos 6 caracteres",
      invalidCredentials: "Correo o contraseña inválidos",
      emailAlreadyRegistered: "Este correo ya está registrado",
      loginSuccess: "¡Inicio de sesión exitoso!",
      signupSuccess: "¡Registro exitoso! Iniciando sesión...",
    },
    nav: {
      dashboard: "Panel",
      primaryBank: "Banco Principal",
      customers: "Clientes",
      actionsAgenda: "Agenda de Acciones",
      aiAssistant: "Asistente AI",
      thresholds: "Umbrales",
      settings: "Configuración",
      mainMenu: "Menú Principal",
      system: "Sistema",
      searchPlaceholder: "Buscar clientes, acciones...",
    },
    dashboard: {
      portfolioDashboard: "Panel de Cartera",
      welcomeBack: "Bienvenido de nuevo",
      portfolioOverview: "Resumen de su cartera.",
      selectDate: "Seleccionar fecha",
      totalCustomers: "Total de Clientes",
      scaleUpEnterprise: "Scale Up Enterprise",
      activeCustomers: "Clientes Activos",
      totalVolume: "Volumen Total",
      pendingActions: "Acciones Pendientes",
      createRecords: "Crear Registros",
      productPerformance: "Rendimiento del Producto",
      aiInsights: "Perspectivas AI",
      generateInsights: "Generar Perspectivas",
      regenerateInsights: "Regenerar",
      noInsightsYet: "Sin perspectivas aún",
      insightsDescription: "Haga clic en el botón para generar perspectivas AI.",
      primaryBankScore: "Puntuación Banco Principal",
      benchmarkScore: "Puntuación de Referencia",
      primary: "Principal",
      target: "Objetivo",
      rest: "Resto",
      planned: "Planificado",
      completed: "Completado",
      pending: "Pendiente",
      customers: "Clientes",
      primaryBank: "Banco Principal",
      externalProducts: "Productos Externos",
      internalProducts: "Productos Internos",
      scoreBreakdown: "Desglose de Puntuación de Principalidad de Cartera",
      scoreExplanation:
        "La Puntuación de Banco Principal mide cuánto de las relaciones bancarias de sus clientes están concentradas en nuestro banco a través de cuatro ejes clave.",
      onTrack: "En Camino",
      atRisk: "En Riesgo",
      critical: "Crítico",
      melting: "Derritiendo",
      growing: "Creciendo",
      ticketSize: "Tamaño de Ticket ⚠",
      diversity: "Diversidad ⚠",
      relatedProducts: "Productos Relacionados",
      viewCustomers: "Ver Clientes",
      noDataAvailable: 'No hay datos disponibles. Haga clic en "Crear Registros" para inicializar objetivos.',
      type: "Tipo",
      stock: "Stock",
      flow: "Flujo",
      customerCount: "Cantidad de Clientes",
      volume: "Volumen",
      hgo: "HGO",
      ytd: "AÑO",
      mtd: "MES",
      retry: "Reintentar",
      analyzing: "AI está analizando el rendimiento del producto",
      failedToLoad: "Error al cargar perspectivas. Por favor intente de nuevo.",
    },
    customers: {
      title: "Clientes",
      description: "Gestione su cartera de clientes",
      searchPlaceholder: "Buscar nombre de cliente...",
      newCustomer: "Nuevo Cliente",
      generateCustomer: "Generar Cliente",
      noCustomers: "No se encontraron clientes",
      noCustomersDescription: "Ningún cliente coincide con los filtros seleccionados.",
      customerName: "Nombre del Cliente",
      group: "Grupo",
      sector: "Sector",
      segment: "Segmento",
      products: "Productos",
      principality: "Principalidad",
      lastActivity: "Última Actividad",
      customerDetail: "Detalle del Cliente",
      customerSummary: "Resumen del Cliente",
      customerProducts: "Productos del Cliente",
      customerActions: "Acciones del Cliente",
      autopilot: "AutoPilot",
      addAction: "Agregar Acción",
      allGroups: "Todos los Grupos",
      allSectors: "Todos los Sectores",
      allSegments: "Todos los Segmentos",
      allStatuses: "Todos los Estados",
      allProducts: "Todos los Productos",
      hasActions: "Con Acciones",
      noActions: "Sin Acciones",
    },
    actions: {
      title: "Agenda de Acciones",
      description: "Sus acciones planificadas y pendientes",
      planned: "Planificado",
      pending: "Pendiente",
      completed: "Completado",
      postponed: "Pospuesto",
      notInterested: "No Interesado",
      notPossible: "No Posible",
      highPriority: "Alta Prioridad",
      mediumPriority: "Prioridad Media",
      lowPriority: "Baja Prioridad",
      noActionsPlanned: "No hay acciones planificadas",
      noActionsDay: "No tiene acciones planificadas para este día.",
      noActionsWeek: "No tiene acciones planificadas para esta semana.",
      noActionsMonth: "No tiene acciones planificadas para este mes.",
      letAIFind: "Deje que AI encuentre los mejores clientes para usted",
      actionsInView: "acciones en vista",
      allPlannedPending: "Todas las acciones planificadas y pendientes",
      plannedActions: "Acciones planificadas",
      pendingActions: "Acciones pendientes",
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
      list: "Lista",
      noActionsFound: "No se encontraron acciones",
      planDay: "Planificar",
      preferredView: "Vista Preferida",
      preferredViewDescription: "Seleccione la vista predeterminada para la agenda de acciones",
      priority: "Prioridad",
      status: "Estado",
      action: "Acción",
      customer: "Cliente",
      product: "Producto",
      date: "Fecha",
    },
    settings: {
      title: "Configuración",
      description: "Administrar configuración de la aplicación",
      language: "Idioma",
      languageDescription: "Seleccionar idioma de la aplicación",
      documentation: "Documentación",
      documentationDescription: "Ver archivo README del proyecto",
      viewDocumentation: "Ver Documentación",
      theme: "Tema",
      themeDescription: "Seleccionar tema de la aplicación",
      notifications: "Notificaciones",
      notificationsDescription: "Administrar preferencias de notificación",
      projectDocumentation: "Documentación del Proyecto",
      backToSettings: "Volver a Configuración",
    },
    thresholds: {
      title: "Umbrales",
      description: "Gestionar umbrales de productos",
      product: "Producto",
      thresholdValue: "Valor Umbral",
      version: "Versión",
      calculationDate: "Fecha de Cálculo",
      active: "Activo",
      inactive: "Inactivo",
      adminRequired: "Se requieren privilegios de administrador para editar umbrales.",
      noThresholds: "No se encontraron umbrales",
      editThreshold: "Editar Umbral",
      saveThreshold: "Guardar Umbral",
    },
    ai: {
      title: "Asistente AI",
      description: "Haga preguntas sobre su cartera",
      newChat: "Nueva Conversación",
      typeMessage: "Escriba su mensaje...",
      send: "Enviar",
      thinking: "Pensando...",
      chatHistory: "Historial de Chat",
      noPreviousChats: "No se encontraron chats anteriores",
      deleteChat: "Eliminar Chat",
      welcomeMessage: "¡Hola! Puedo ayudarte a encontrar en qué clientes enfocarte hoy.",
      startNewChat: "Iniciar nueva conversación",
      privacyNotice: "Las identidades de sus clientes están protegidas",
      privacyDetail1: "Los nombres de los clientes no se comparten directamente con la IA",
      privacyDetail2: "Se generan IDs únicos indetectables para cada sesión por separado",
      privacyDetail3: "Los IDs entrantes se asignan a clientes dentro de su sesión del navegador",
      privacyDetail4: "La información sensible en las notas se enmascara antes de enviar el prompt",
      communicationError: "Error al comunicarse con el asistente AI",
      planMyDay: "Planificar Mi Día",
    },
    customerDetail: {
      principalityScore: "Puntuación de Principalidad",
      customerNotFound: "Cliente no encontrado",
      generateActions: "Generar Acciones",
      generatingActions: "Generando acciones...",
      actionsGenerated: "acciones generadas exitosamente",
      noActionsGenerated: "No se generaron acciones para este cliente",
      actionGenerationFailed: "Error al generar acciones",
      gap: "Brecha",
      threshold: "Umbral",
      currentValue: "Valor Actual",
      owned: "Propio",
      notOwned: "No Propio",
      actionFor: "acción para",
      priority: "Prioridad",
      high: "Alta",
      medium: "Media",
      low: "Baja",
    },
    notFound: {
      title: "404",
      message: "Página no encontrada",
      returnHome: "Volver al Inicio",
    },
    languages: {
      turkish: "Türkçe",
      english: "English",
      spanish: "Español",
    },
    statusLabels: {
      Beklemede: "Pendiente",
      Planlandı: "Planificado",
      Tamamlandı: "Completado",
      Ertelendi: "Pospuesto",
      İlgilenmiyor: "No Interesado",
      "Uygun Değil": "No Posible",
    },
    customerStatusLabels: {
      "Yeni Müşteri": "Nuevo Cliente",
      Aktif: "Activo",
      Target: "Objetivo",
      "Strong Target": "Objetivo Fuerte",
      "Ana Banka": "Banco Principal",
    },
    sectorLabels: {
      Turizm: "Turismo",
      Ulaşım: "Transporte",
      Perakende: "Retail",
      Gayrimenkul: "Inmobiliario",
      "Tarım Hayvancılık": "Agricultura",
      Sağlık: "Salud",
      Enerji: "Energía",
    },
    segmentLabels: {
      MİKRO: "Micro",
      Kİ: "Pequeña Empresa",
      OBİ: "Mediana",
      TİCARİ: "Comercial",
    },
    categoryLabels: {
      Kredi: "Crédito",
      Kaynak: "Financiamiento",
      Ödeme: "Pagos",
      Tahsilat: "Cobranzas",
      Sigorta: "Seguros",
      İştirak: "Participación",
    },
    calendar: {
      mon: "Lun",
      tue: "Mar",
      wed: "Mié",
      thu: "Jue",
      fri: "Vie",
      sat: "Sáb",
      sun: "Dom",
    },
  },
};
