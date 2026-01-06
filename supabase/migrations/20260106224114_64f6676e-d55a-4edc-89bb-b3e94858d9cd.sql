
-- Create table for action templates (possible actions per product)
CREATE TABLE public.action_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for required fields per action template
CREATE TABLE public.action_template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID NOT NULL REFERENCES public.action_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'currency', 'date', 'select')),
  field_options TEXT[], -- For select type fields
  display_order INTEGER NOT NULL DEFAULT 999,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_template_fields ENABLE ROW LEVEL SECURITY;

-- RLS policies - viewable by all authenticated users (like products)
CREATE POLICY "Action templates are viewable by all authenticated users"
ON public.action_templates FOR SELECT USING (true);

CREATE POLICY "Action template fields are viewable by all authenticated users"
ON public.action_template_fields FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_action_templates_product_id ON public.action_templates(product_id);
CREATE INDEX idx_action_template_fields_template_id ON public.action_template_fields(action_template_id);

-- Insert action templates for each product
-- We'll use a DO block to get product IDs dynamically

DO $$
DECLARE
  v_product_id UUID;
  v_template_id UUID;
BEGIN
  -- LOANS: Bireysel Kredi
  SELECT id INTO v_product_id FROM products WHERE name = 'Bireysel Kredi' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Yeni taksitli kredi', 'Müşteriye yeni taksitli kredi teklifi', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Talep edilen tutar', 'currency', 1),
      (v_template_id, 'Vade (ay)', 'select', 2),
      (v_template_id, 'Kullanım amacı', 'text', 3);
    UPDATE action_template_fields SET field_options = ARRAY['12', '24', '36', '48', '60'] WHERE action_template_id = v_template_id AND field_name = 'Vade (ay)';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Kredi limiti artışı', 'Mevcut kredi limitini artırma', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut limit', 'currency', 1),
      (v_template_id, 'Talep edilen limit', 'currency', 2),
      (v_template_id, 'Aylık gelir', 'currency', 3);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Kredi yenileme', 'Mevcut kredinin yenilenmesi', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut kredi tutarı', 'currency', 1),
      (v_template_id, 'Yenileme tutarı', 'currency', 2),
      (v_template_id, 'Vade tarihi', 'date', 3);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Faiz oranı güncelleme', 'Kredi faiz oranının güncellenmesi', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut faiz oranı', 'text', 1),
      (v_template_id, 'Talep edilen oran', 'text', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Erken ödeme teklifi', 'Erken ödeme ile indirim teklifi', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Kalan borç', 'currency', 1),
      (v_template_id, 'Önerilen indirim oranı', 'text', 2);
  END IF;

  -- LOANS: Ticari Kredi
  SELECT id INTO v_product_id FROM products WHERE name = 'Ticari Kredi' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'İşletme kredisi', 'Yeni işletme kredisi teklifi', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Talep edilen tutar', 'currency', 1),
      (v_template_id, 'Kredi türü', 'select', 2),
      (v_template_id, 'Teminat türü', 'text', 3);
    UPDATE action_template_fields SET field_options = ARRAY['Spot', 'Rotatif', 'Taksitli'] WHERE action_template_id = v_template_id AND field_name = 'Kredi türü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Çek/senet iskontosu', 'Çek veya senet iskonto teklifi', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Toplam portföy tutarı', 'currency', 1),
      (v_template_id, 'Ortalama vade', 'number', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Akreditif limiti', 'Akreditif limit tahsisi', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Talep edilen limit', 'currency', 1),
      (v_template_id, 'İthalat/İhracat', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['İthalat', 'İhracat', 'Her ikisi'] WHERE action_template_id = v_template_id AND field_name = 'İthalat/İhracat';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Teminat mektubu', 'Teminat mektubu tahsisi', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mektup tutarı', 'currency', 1),
      (v_template_id, 'Mektup türü', 'select', 2),
      (v_template_id, 'Vade', 'date', 3);
    UPDATE action_template_fields SET field_options = ARRAY['Geçici', 'Kesin', 'Avans'] WHERE action_template_id = v_template_id AND field_name = 'Mektup türü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Faktoring teklifi', 'Faktoring hizmeti teklifi', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aylık ciro', 'currency', 1),
      (v_template_id, 'Müşteri sayısı', 'number', 2);
  END IF;

  -- DEPOSITS: Vadesiz Mevduat
  SELECT id INTO v_product_id FROM products WHERE name = 'Vadesiz Mevduat' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Hesap açılışı', 'Yeni vadesiz hesap açılışı', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Hesap para birimi', 'select', 1),
      (v_template_id, 'Tahmini bakiye', 'currency', 2);
    UPDATE action_template_fields SET field_options = ARRAY['TRY', 'USD', 'EUR'] WHERE action_template_id = v_template_id AND field_name = 'Hesap para birimi';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Bakiye artırma', 'Vadesiz hesap bakiyesini artırma', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut bakiye', 'currency', 1),
      (v_template_id, 'Hedef bakiye', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Maaş müşterisi', 'Maaş ödemelerini bankaya çekme', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Çalışan sayısı', 'number', 1),
      (v_template_id, 'Toplam maaş tutarı', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Otomatik ödeme talimatı', 'Fatura ve düzenli ödemeler', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Ödeme türü', 'select', 1),
      (v_template_id, 'Aylık tutar', 'currency', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Fatura', 'Kira', 'Kredi', 'Diğer'] WHERE action_template_id = v_template_id AND field_name = 'Ödeme türü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Dijital kanal aktivasyonu', 'İnternet/mobil bankacılık aktivasyonu', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Tercih edilen kanal', 'select', 1);
    UPDATE action_template_fields SET field_options = ARRAY['Mobil', 'İnternet', 'Her ikisi'] WHERE action_template_id = v_template_id AND field_name = 'Tercih edilen kanal';
  END IF;

  -- DEPOSITS: Vadeli Mevduat
  SELECT id INTO v_product_id FROM products WHERE name = 'Vadeli Mevduat' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Yeni vadeli hesap', 'Vadeli mevduat hesabı açılışı', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Yatırım tutarı', 'currency', 1),
      (v_template_id, 'Vade', 'select', 2),
      (v_template_id, 'Para birimi', 'select', 3);
    UPDATE action_template_fields SET field_options = ARRAY['1 ay', '3 ay', '6 ay', '12 ay'] WHERE action_template_id = v_template_id AND field_name = 'Vade';
    UPDATE action_template_fields SET field_options = ARRAY['TRY', 'USD', 'EUR'] WHERE action_template_id = v_template_id AND field_name = 'Para birimi';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Vade yenileme', 'Mevcut vadeli hesabın yenilenmesi', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut tutar', 'currency', 1),
      (v_template_id, 'Yeni vade', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['1 ay', '3 ay', '6 ay', '12 ay'] WHERE action_template_id = v_template_id AND field_name = 'Yeni vade';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Faiz artırma kampanyası', 'Özel faiz oranı teklifi', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Minimum tutar', 'currency', 1),
      (v_template_id, 'Teklif edilen oran', 'text', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Birikimli mevduat', 'Düzenli birikim planı', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aylık birikim tutarı', 'currency', 1),
      (v_template_id, 'Hedef süre', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['6 ay', '12 ay', '24 ay', '36 ay'] WHERE action_template_id = v_template_id AND field_name = 'Hedef süre';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Döviz hesabı dönüşüm', 'TL/Döviz hesap dönüşümü', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Dönüşüm tutarı', 'currency', 1),
      (v_template_id, 'Hedef para birimi', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['TRY', 'USD', 'EUR', 'GBP'] WHERE action_template_id = v_template_id AND field_name = 'Hedef para birimi';
  END IF;

  -- FX: Döviz İşlemleri
  SELECT id INTO v_product_id FROM products WHERE name = 'Döviz İşlemleri' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Spot döviz işlemi', 'Anlık döviz alım/satım', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'İşlem tutarı', 'currency', 1),
      (v_template_id, 'Döviz cinsi', 'select', 2),
      (v_template_id, 'İşlem yönü', 'select', 3);
    UPDATE action_template_fields SET field_options = ARRAY['USD', 'EUR', 'GBP', 'CHF'] WHERE action_template_id = v_template_id AND field_name = 'Döviz cinsi';
    UPDATE action_template_fields SET field_options = ARRAY['Alış', 'Satış'] WHERE action_template_id = v_template_id AND field_name = 'İşlem yönü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Forward işlem', 'Vadeli döviz işlemi', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'İşlem tutarı', 'currency', 1),
      (v_template_id, 'Vade tarihi', 'date', 2),
      (v_template_id, 'Döviz cinsi', 'select', 3);
    UPDATE action_template_fields SET field_options = ARRAY['USD', 'EUR', 'GBP'] WHERE action_template_id = v_template_id AND field_name = 'Döviz cinsi';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Döviz hedging', 'Kur riski yönetimi', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aylık döviz ihtiyacı', 'currency', 1),
      (v_template_id, 'Risk toleransı', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Düşük', 'Orta', 'Yüksek'] WHERE action_template_id = v_template_id AND field_name = 'Risk toleransı';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Opsiyon işlemi', 'Döviz opsiyonu teklifi', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Nominal tutar', 'currency', 1),
      (v_template_id, 'Strike fiyatı', 'text', 2),
      (v_template_id, 'Vade', 'date', 3);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Döviz hesabı açma', 'Yeni döviz hesabı', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Para birimi', 'select', 1),
      (v_template_id, 'Tahmini bakiye', 'currency', 2);
    UPDATE action_template_fields SET field_options = ARRAY['USD', 'EUR', 'GBP', 'CHF'] WHERE action_template_id = v_template_id AND field_name = 'Para birimi';
  END IF;

  -- CARDS: Kredi Kartı
  SELECT id INTO v_product_id FROM products WHERE name = 'Kredi Kartı' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Yeni kart başvurusu', 'Kredi kartı başvurusu', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Kart türü', 'select', 1),
      (v_template_id, 'Talep edilen limit', 'currency', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Classic', 'Gold', 'Platinum', 'Black'] WHERE action_template_id = v_template_id AND field_name = 'Kart türü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Limit artışı', 'Kredi kartı limit artışı', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut limit', 'currency', 1),
      (v_template_id, 'Talep edilen limit', 'currency', 2),
      (v_template_id, 'Aylık harcama', 'currency', 3);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Kart yükseltme', 'Üst segment karta geçiş', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut kart', 'text', 1),
      (v_template_id, 'Hedef kart', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Gold', 'Platinum', 'Black', 'Infinite'] WHERE action_template_id = v_template_id AND field_name = 'Hedef kart';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Taksitlendirme', 'Harcama taksitlendirme teklifi', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Taksitlendirilecek tutar', 'currency', 1),
      (v_template_id, 'Taksit sayısı', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['3', '6', '9', '12'] WHERE action_template_id = v_template_id AND field_name = 'Taksit sayısı';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Ek kart', 'Ek kart başvurusu', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Ek kart sahibi', 'text', 1),
      (v_template_id, 'Alt limit', 'currency', 2);
  END IF;

  -- CARDS: Banka Kartı
  SELECT id INTO v_product_id FROM products WHERE name = 'Banka Kartı' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Yeni banka kartı', 'Banka kartı başvurusu', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Kart türü', 'select', 1);
    UPDATE action_template_fields SET field_options = ARRAY['Standart', 'Temassız', 'Sanal'] WHERE action_template_id = v_template_id AND field_name = 'Kart türü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Günlük limit artışı', 'ATM/POS günlük limit artışı', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut limit', 'currency', 1),
      (v_template_id, 'Talep edilen limit', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Online alışveriş aktivasyonu', 'İnternet alışverişi açma', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Online limit', 'currency', 1);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Yurtdışı kullanım', 'Yurtdışı işlem açma', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aktif ülkeler', 'text', 1),
      (v_template_id, 'Yurtdışı limiti', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Temassız limit', 'Temassız işlem limiti ayarlama', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Temassız limit', 'currency', 1);
  END IF;

  -- INSURANCE: Hayat Sigortası
  SELECT id INTO v_product_id FROM products WHERE name = 'Hayat Sigortası' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Hayat sigortası teklifi', 'Hayat sigortası poliçesi', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Teminat tutarı', 'currency', 1),
      (v_template_id, 'Sigorta süresi', 'select', 2),
      (v_template_id, 'Lehdar sayısı', 'number', 3);
    UPDATE action_template_fields SET field_options = ARRAY['1 yıl', '5 yıl', '10 yıl', '20 yıl'] WHERE action_template_id = v_template_id AND field_name = 'Sigorta süresi';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Teminat artırma', 'Mevcut poliçe teminat artışı', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut teminat', 'currency', 1),
      (v_template_id, 'Talep edilen teminat', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Birikimli hayat sigortası', 'Birikimli poliçe teklifi', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aylık prim', 'currency', 1),
      (v_template_id, 'Vade süresi', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['10 yıl', '15 yıl', '20 yıl', '25 yıl'] WHERE action_template_id = v_template_id AND field_name = 'Vade süresi';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Ferdi kaza eki', 'Ferdi kaza teminatı ekleme', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Kaza teminatı', 'currency', 1);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Poliçe yenileme', 'Mevcut poliçenin yenilenmesi', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut prim', 'currency', 1),
      (v_template_id, 'Yenileme şartları', 'text', 2);
  END IF;

  -- INSURANCE: Sağlık Sigortası
  SELECT id INTO v_product_id FROM products WHERE name = 'Sağlık Sigortası' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Bireysel sağlık sigortası', 'Sağlık sigortası teklifi', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Plan türü', 'select', 1),
      (v_template_id, 'Kapsam', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Temel', 'Kapsamlı', 'VIP'] WHERE action_template_id = v_template_id AND field_name = 'Plan türü';
    UPDATE action_template_fields SET field_options = ARRAY['Yatarak', 'Ayakta', 'Tam kapsamlı'] WHERE action_template_id = v_template_id AND field_name = 'Kapsam';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Aile sağlık paketi', 'Aile için sağlık sigortası', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aile üye sayısı', 'number', 1),
      (v_template_id, 'Plan türü', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Temel', 'Kapsamlı', 'VIP'] WHERE action_template_id = v_template_id AND field_name = 'Plan türü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Diş teminatı ekleme', 'Diş sağlığı teminatı', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Yıllık limit', 'currency', 1);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Yurtdışı sağlık', 'Yurtdışı sağlık teminatı', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Kapsam bölgesi', 'select', 1),
      (v_template_id, 'Süre', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Avrupa', 'Dünya', 'ABD dahil'] WHERE action_template_id = v_template_id AND field_name = 'Kapsam bölgesi';
    UPDATE action_template_fields SET field_options = ARRAY['30 gün', '90 gün', '180 gün', '1 yıl'] WHERE action_template_id = v_template_id AND field_name = 'Süre';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Check-up paketi', 'Periyodik sağlık kontrolü', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Paket türü', 'select', 1);
    UPDATE action_template_fields SET field_options = ARRAY['Temel', 'Detaylı', 'Executive'] WHERE action_template_id = v_template_id AND field_name = 'Paket türü';
  END IF;

  -- INVESTMENT: Yatırım Fonları
  SELECT id INTO v_product_id FROM products WHERE name = 'Yatırım Fonları' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Fon yatırımı', 'Yatırım fonu alımı', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Yatırım tutarı', 'currency', 1),
      (v_template_id, 'Fon türü', 'select', 2),
      (v_template_id, 'Risk profili', 'select', 3);
    UPDATE action_template_fields SET field_options = ARRAY['Para Piyasası', 'Borçlanma', 'Hisse', 'Karma', 'Altın'] WHERE action_template_id = v_template_id AND field_name = 'Fon türü';
    UPDATE action_template_fields SET field_options = ARRAY['Düşük', 'Orta', 'Yüksek'] WHERE action_template_id = v_template_id AND field_name = 'Risk profili';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Portföy çeşitlendirme', 'Mevcut portföy optimizasyonu', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut portföy değeri', 'currency', 1),
      (v_template_id, 'Hedef dağılım', 'text', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Düzenli yatırım planı', 'Otomatik fon alımı', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aylık tutar', 'currency', 1),
      (v_template_id, 'Fon seçimi', 'text', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Fon switch', 'Fonlar arası geçiş', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Kaynak fon', 'text', 1),
      (v_template_id, 'Hedef fon', 'text', 2),
      (v_template_id, 'Tutar', 'currency', 3);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'BES geçişi', 'Bireysel emeklilik teklifi', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aylık katkı payı', 'currency', 1),
      (v_template_id, 'İşveren katkısı', 'currency', 2);
  END IF;

  -- PAYMENT: POS
  SELECT id INTO v_product_id FROM products WHERE name = 'POS' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Yeni POS başvurusu', 'POS cihazı tahsisi', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'POS türü', 'select', 1),
      (v_template_id, 'Tahmini ciro', 'currency', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Masaüstü', 'Mobil', 'Sanal', 'Yazarkasa'] WHERE action_template_id = v_template_id AND field_name = 'POS türü';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Komisyon indirimi', 'POS komisyon oranı düşürme', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut oran', 'text', 1),
      (v_template_id, 'Aylık ciro', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Ek POS talebi', 'İlave POS cihazı', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut POS sayısı', 'number', 1),
      (v_template_id, 'Talep edilen adet', 'number', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Taksit kampanyası', 'Taksitli satış aktivasyonu', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Maksimum taksit', 'select', 1);
    UPDATE action_template_fields SET field_options = ARRAY['3', '6', '9', '12'] WHERE action_template_id = v_template_id AND field_name = 'Maksimum taksit';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Sanal POS entegrasyonu', 'E-ticaret POS entegrasyonu', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'E-ticaret platformu', 'text', 1),
      (v_template_id, 'Tahmini online ciro', 'currency', 2);
  END IF;

  -- PAYMENT: Havale/EFT
  SELECT id INTO v_product_id FROM products WHERE name = 'Havale/EFT' LIMIT 1;
  IF v_product_id IS NOT NULL THEN
    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Toplu ödeme sistemi', 'Toplu transfer çözümü', 1) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Aylık işlem adedi', 'number', 1),
      (v_template_id, 'Toplam tutar', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'FAST aktivasyonu', 'Anlık transfer sistemi', 2) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Günlük limit', 'currency', 1);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Düzenli transfer talimatı', 'Otomatik transfer emri', 3) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Transfer tutarı', 'currency', 1),
      (v_template_id, 'Periyot', 'select', 2);
    UPDATE action_template_fields SET field_options = ARRAY['Günlük', 'Haftalık', 'Aylık'] WHERE action_template_id = v_template_id AND field_name = 'Periyot';

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Uluslararası transfer', 'SWIFT/Havale hizmeti', 4) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Hedef ülke', 'text', 1),
      (v_template_id, 'Aylık hacim', 'currency', 2);

    INSERT INTO action_templates (product_id, name, description, display_order) VALUES
      (v_product_id, 'Limit artışı', 'Transfer limit artışı', 5) RETURNING id INTO v_template_id;
    INSERT INTO action_template_fields (action_template_id, field_name, field_type, display_order) VALUES
      (v_template_id, 'Mevcut limit', 'currency', 1),
      (v_template_id, 'Talep edilen limit', 'currency', 2);
  END IF;

END $$;
