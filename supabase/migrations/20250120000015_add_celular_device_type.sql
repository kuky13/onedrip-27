-- Add 'Celular' device type for better user experience
-- This ensures the device type field can be pre-selected with 'Celular'

INSERT INTO public.device_types (name) VALUES 
    ('Celular')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to ensure the new device type is accessible
GRANT SELECT ON public.device_types TO anon;
GRANT SELECT ON public.device_types TO authenticated;