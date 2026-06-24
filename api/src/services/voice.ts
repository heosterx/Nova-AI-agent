const CARTESIA_API_URL = 'https://api.cartesia.ai';

export interface VoiceInfo {
  id: string;
  name: string;
  description: string;
}

export async function getCartesiaToken(): Promise<string> {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    throw new Error('CARTESIA_API_KEY not configured');
  }
  return apiKey;
}

export async function listVoices(): Promise<VoiceInfo[]> {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(`${CARTESIA_API_URL}/voices`, {
      headers: {
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list voices: ${response.status}`);
    }

    const voices = await response.json() as Array<{ id: string; name: string; description: string }>;
    return voices.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
    }));
  } catch (error) {
    console.error('[Voice] Failed to list voices:', error);
    return [];
  }
}

export async function synthesizeSpeech(
  text: string,
  voiceId: string
): Promise<Buffer> {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    throw new Error('CARTESIA_API_KEY not configured');
  }

  const response = await fetch(`${CARTESIA_API_URL}/tts/bytes`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Cartesia-Version': '2024-06-10',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: 'sonic-2',
      transcript: text,
      voice: { mode: 'id', id: voiceId },
      output_format: {
        container: 'wav',
        encoding: 'pcm_f32le',
        sample_rate: 44100,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cartesia TTS failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
