import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice IDs for different languages - using Brian for all (clear, professional)
const VOICE_CONFIG = {
  tr: { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian' }, // Brian - clear English, works well for Turkish
  en: { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian' }, // Brian - professional English
  es: { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian' }, // Brian - also good for Spanish
};

interface GenerateAudioRequest {
  text: string;
  language: 'tr' | 'en' | 'es';
  stepId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { text, language, stepId } = await req.json() as GenerateAudioRequest;

    if (!text || !language) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text and language' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const voiceConfig = VOICE_CONFIG[language] || VOICE_CONFIG.en;
    
    console.log(`Generating audio for step: ${stepId || 'unknown'}, language: ${language}, voice: ${voiceConfig.name}`);

    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2', // Supports all three languages
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 0.95, // Slightly slower for clarity
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Return audio as binary
    const audioBuffer = await response.arrayBuffer();
    
    console.log(`Successfully generated audio: ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating demo audio:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
