-- Add qrPaymentLink field to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "qrPaymentLink" TEXT;

-- Add comment to the column
COMMENT ON COLUMN orders."qrPaymentLink" IS 'QR code payment link for UPI payments';
