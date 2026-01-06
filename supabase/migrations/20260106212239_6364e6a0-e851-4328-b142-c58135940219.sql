-- Add foreign key relationships for actions table
ALTER TABLE public.actions
ADD CONSTRAINT actions_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.actions
ADD CONSTRAINT actions_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;