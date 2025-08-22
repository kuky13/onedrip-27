-- Create admin-assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-assets', 'admin-assets', true);

-- Create admin_images table
CREATE TABLE public.admin_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_images ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_images
CREATE POLICY "Only admins can manage admin images" 
ON public.admin_images 
FOR ALL 
USING (public.is_current_user_admin());

-- Create storage policies for admin-assets bucket
CREATE POLICY "Admins can view admin assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'admin-assets' AND public.is_current_user_admin());

CREATE POLICY "Admins can upload admin assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'admin-assets' AND public.is_current_user_admin());

CREATE POLICY "Admins can update admin assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'admin-assets' AND public.is_current_user_admin());

CREATE POLICY "Admins can delete admin assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'admin-assets' AND public.is_current_user_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_admin_images_updated_at
BEFORE UPDATE ON public.admin_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();