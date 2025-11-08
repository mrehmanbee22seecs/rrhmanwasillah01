import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SignatureRequest {
  timestamp: number;
  folder?: string;
  transformation?: string;
  eager?: string;
  public_id?: string;
}

async function generateSignature(params: Record<string, any>, apiSecret: string): Promise<string> {
  const sortedParams = Object.keys(params)
    .filter(key => params[key])
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const stringToSign = sortedParams + apiSecret;

  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const cloudName = Deno.env.get('VITE_CLOUDINARY_CLOUD_NAME');

    if (!apiSecret || !apiKey || !cloudName) {
      throw new Error('Cloudinary configuration missing in environment');
    }

    const { timestamp, folder, transformation, eager, public_id }: SignatureRequest = await req.json();

    const paramsToSign: Record<string, any> = {
      timestamp: timestamp || Math.floor(Date.now() / 1000),
    };

    if (folder) paramsToSign.folder = folder;
    if (transformation) paramsToSign.transformation = transformation;
    if (eager) paramsToSign.eager = eager;
    if (public_id) paramsToSign.public_id = public_id;

    const signature = await generateSignature(paramsToSign, apiSecret);

    const response = {
      signature,
      timestamp: paramsToSign.timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      ...paramsToSign
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error generating signature:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate signature'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
