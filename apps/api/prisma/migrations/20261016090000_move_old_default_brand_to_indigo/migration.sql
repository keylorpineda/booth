-- Stores that still use the previous default brand color (orange) never chose a color:
-- move them to the new default (indigo). Stores with a custom color keep it.
UPDATE "Store" SET "brandColor" = '#4F46E5' WHERE "brandColor" = '#E85D3A';
