-- Create storage bucket for demo audio cache
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-audio', 'demo-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to demo audio files
CREATE POLICY "Public read access for demo audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-audio');

-- Allow authenticated users to upload demo audio files
CREATE POLICY "Authenticated users can upload demo audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'demo-audio' AND auth.role() = 'authenticated');

-- Allow service role to manage demo audio files
CREATE POLICY "Service role full access to demo audio"
ON storage.objects FOR ALL
USING (bucket_id = 'demo-audio')
WITH CHECK (bucket_id = 'demo-audio');