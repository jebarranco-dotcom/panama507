-- Actualiza el usuario de TikTok de PANAMA REAL ESTATE
UPDATE public.cuentas_sociales
SET usuario = '@panamarealestatebr', updated_at = now()
WHERE empresa_id = '22222222-2222-4222-8222-222222222222'
  AND red = 'tiktok';

UPDATE public.conexiones_redes
SET cuenta_externa_nombre = '@panamarealestatebr', updated_at = now()
WHERE empresa_id = '22222222-2222-4222-8222-222222222222'
  AND red = 'tiktok'
  AND cuenta_externa_nombre IN ('@panamarealestate', '');
