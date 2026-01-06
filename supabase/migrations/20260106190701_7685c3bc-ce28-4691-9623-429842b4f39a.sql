-- First, create a new enum type with the Turkish values
CREATE TYPE product_category_new AS ENUM ('Kredi', 'Kaynak', 'Ödeme', 'Tahsilat', 'Sigorta', 'İştirak');

-- Alter the column to text first to allow mapping
ALTER TABLE products ALTER COLUMN category TYPE text;

-- Update existing products to map old categories to new ones
UPDATE products SET category = 'Kredi' WHERE category IN ('loans', 'external');
UPDATE products SET category = 'Kaynak' WHERE category IN ('deposits', 'investment');
UPDATE products SET category = 'Ödeme' WHERE category IN ('payment', 'fx');
UPDATE products SET category = 'Tahsilat' WHERE category = 'cards';
UPDATE products SET category = 'Sigorta' WHERE category = 'insurance';

-- Set any remaining unmapped categories to a default
UPDATE products SET category = 'Kredi' WHERE category NOT IN ('Kredi', 'Kaynak', 'Ödeme', 'Tahsilat', 'Sigorta', 'İştirak');

-- Alter the column to use the new enum type
ALTER TABLE products ALTER COLUMN category TYPE product_category_new USING category::product_category_new;

-- Drop the old enum type and rename the new one
DROP TYPE IF EXISTS product_category;
ALTER TYPE product_category_new RENAME TO product_category;