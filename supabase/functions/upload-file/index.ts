import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadRequest {
  file: string;
  data: string; // base64 encoded, possibly compressed
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { file, data }: UploadRequest = await req.json();

    if (!file || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: file and data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 data
    let decodedData: Uint8Array;
    let bytes: Uint8Array;
    
    try {
      // Decode base64 to binary
      const binaryString = atob(data);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid base64 data", details: String(e) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if data is gzip compressed (magic bytes: 0x1f 0x8b)
    const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

    if (isGzip) {
      try {
        const ds = new DecompressionStream("gzip");
        const writer = ds.writable.getWriter();
        writer.write(bytes.slice().buffer);
        writer.close();

        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Combine all chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        decodedData = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          decodedData.set(chunk, offset);
          offset += chunk.length;
        }
      } catch (e) {
        console.error("Gzip decompression failed:", e);
        // Fall back to raw bytes if decompression fails
        decodedData = bytes;
      }
    } else {
      // Not gzip compressed, use raw decoded bytes
      decodedData = bytes;
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bucketName = "uploads";
    const filePath = file;

    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'txt': 'text/plain',
        'json': 'application/json',
        'csv': 'text/csv',
        'xml': 'application/xml',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
      };
      return mimeTypes[ext || ''] || 'application/octet-stream';
    };

    const contentType = getContentType(filePath);

    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    let finalData: Uint8Array;

    if (existingFile) {
      // File exists - append new data to existing content
      const existingBytes = new Uint8Array(await existingFile.arrayBuffer());
      finalData = new Uint8Array(existingBytes.length + decodedData.length);
      finalData.set(existingBytes, 0);
      finalData.set(decodedData, existingBytes.length);

      // Update the file with appended content
      const { error: updateError } = await supabase.storage
        .from(bucketName)
        .update(filePath, finalData, {
          contentType,
          upsert: true,
        });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update file", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // File doesn't exist - create new file
      finalData = decodedData;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, finalData, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        return new Response(
          JSON.stringify({ error: "Failed to upload file", details: uploadError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        file: filePath,
        size: finalData.length,
        appended: !!existingFile,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
