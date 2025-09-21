-- Create storage bucket for user headshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('headshots', 'headshots', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for headshots bucket
CREATE POLICY "Users can upload their own headshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Headshots are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'headshots');

CREATE POLICY "Users can update their own headshots" ON storage.objects
FOR UPDATE USING (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own headshots" ON storage.objects
FOR DELETE USING (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);
