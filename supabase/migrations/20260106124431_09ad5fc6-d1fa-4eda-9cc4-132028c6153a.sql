-- Create product_thresholds table for sector/segment/product threshold values
CREATE TABLE public.product_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector public.customer_sector NOT NULL,
  segment public.customer_segment NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  threshold_value NUMERIC NOT NULL DEFAULT 0,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  version_num INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sector, segment, product_id, version_num)
);

-- Enable RLS
ALTER TABLE public.product_thresholds ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view thresholds (read-only for most)
CREATE POLICY "Authenticated users can view thresholds"
ON public.product_thresholds
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can modify thresholds (for now, allow all authenticated users)
CREATE POLICY "Authenticated users can insert thresholds"
ON public.product_thresholds
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update thresholds"
ON public.product_thresholds
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete thresholds"
ON public.product_thresholds
FOR DELETE
USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE TRIGGER update_product_thresholds_updated_at
BEFORE UPDATE ON public.product_thresholds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_product_thresholds_active ON public.product_thresholds(is_active);
CREATE INDEX idx_product_thresholds_sector_segment ON public.product_thresholds(sector, segment);