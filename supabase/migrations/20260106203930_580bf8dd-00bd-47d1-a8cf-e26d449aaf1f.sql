-- Add order column to products table
ALTER TABLE public.products ADD COLUMN display_order integer NOT NULL DEFAULT 999;

-- Update order values for each product
UPDATE public.products SET display_order = 1 WHERE name = 'TL Nakdi Kredi';
UPDATE public.products SET display_order = 2 WHERE name = 'YP Nakdi Kredi';
UPDATE public.products SET display_order = 3 WHERE name = 'TL Gayrinakdi Kredi';
UPDATE public.products SET display_order = 4 WHERE name = 'YP Gayrinakdi Kredi';
UPDATE public.products SET display_order = 5 WHERE name = 'TL Vadeli Mevduat';
UPDATE public.products SET display_order = 6 WHERE name = 'TL Vadesiz Mevduat';
UPDATE public.products SET display_order = 7 WHERE name = 'YP Vadeli Mevduat';
UPDATE public.products SET display_order = 8 WHERE name = 'YP Vadesiz Mevduat';
UPDATE public.products SET display_order = 9 WHERE name = 'TL Yatırım Fonu';
UPDATE public.products SET display_order = 10 WHERE name = 'YP Yatırım Fonu';
UPDATE public.products SET display_order = 11 WHERE name = 'Ticari Kart';
UPDATE public.products SET display_order = 12 WHERE name = 'Ödeme Çeki';
UPDATE public.products SET display_order = 13 WHERE name = 'Maaş Ödemesi';
UPDATE public.products SET display_order = 14 WHERE name = 'Garantili Ödeme';
UPDATE public.products SET display_order = 15 WHERE name = 'DTS';
UPDATE public.products SET display_order = 16 WHERE name = 'Üye İşyeri';
UPDATE public.products SET display_order = 17 WHERE name = 'Tahsil Çeki';
UPDATE public.products SET display_order = 18 WHERE name = 'Elementer Sigorta';
UPDATE public.products SET display_order = 19 WHERE name = 'Hayat Sigortası';
UPDATE public.products SET display_order = 20 WHERE name = 'BES';
UPDATE public.products SET display_order = 21 WHERE name = 'Faktoring';
UPDATE public.products SET display_order = 22 WHERE name = 'Leasing';
UPDATE public.products SET display_order = 23 WHERE name = 'Garanti Filo Kiralama';

-- Create index for efficient ordering
CREATE INDEX idx_products_display_order ON public.products(display_order);