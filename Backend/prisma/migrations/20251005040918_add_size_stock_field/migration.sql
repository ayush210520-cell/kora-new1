-- Add sizeStock field to products table
ALTER TABLE "products" ADD COLUMN "sizeStock" JSONB;

-- Add comment to explain the field
COMMENT ON COLUMN "products"."sizeStock" IS 'Size-wise stock management: {"S": 10, "M": 15, "L": 8, "XL": 5}';
