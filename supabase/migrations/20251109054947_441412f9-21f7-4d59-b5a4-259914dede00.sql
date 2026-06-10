-- Create visitors counter table
CREATE TABLE IF NOT EXISTS public.site_visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial record if table is empty
INSERT INTO public.site_visitors (count)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM public.site_visitors);

-- Enable Row Level Security
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read the visitor count
CREATE POLICY "Anyone can view visitor count" 
ON public.site_visitors 
FOR SELECT 
USING (true);

-- Create policy to allow incrementing the counter (public access for increment function)
CREATE POLICY "Anyone can update visitor count" 
ON public.site_visitors 
FOR UPDATE 
USING (true);

-- Create function to increment visitor count
CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.site_visitors
  SET count = count + 1,
      last_updated = now()
  WHERE id = (SELECT id FROM public.site_visitors LIMIT 1)
  RETURNING count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;