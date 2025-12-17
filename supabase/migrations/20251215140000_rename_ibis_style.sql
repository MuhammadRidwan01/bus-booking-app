-- Rename hotel from Ibis Style to Ibis styles
UPDATE hotels
SET name = 'Ibis styles Jakarta', slug = 'ibis-styles'
WHERE slug = 'ibis-style' OR name ILIKE '%Ibis Style%';
