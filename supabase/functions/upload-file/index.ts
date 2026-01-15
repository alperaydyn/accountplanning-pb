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
    let file: string;
    let data: string;

    // Support both GET (query params) and POST (body)
    if (req.method === "GET") {
      const url = new URL(req.url);
      file = url.searchParams.get("file") || "";
      data = url.searchParams.get("data") || "";
    } else {
      const body: UploadRequest = await req.json();
      file = body.file;
      data = body.data;
    }

    if (!file || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: file and data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode URL-safe base64 data (Python: base64.urlsafe_b64encode with padding stripped)
    let decodedData: Uint8Array;
    let bytes: Uint8Array;
    
    try {
      // Convert URL-safe base64 to standard base64
      let standardB64 = data.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add back padding if needed
      const paddingNeeded = (4 - (standardB64.length % 4)) % 4;
      standardB64 += '='.repeat(paddingNeeded);
      
      // Decode base64 to binary
      const binaryString = atob(standardB64);
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

    // Check if data is zlib compressed (magic bytes: 0x78 for zlib)
    // 0x78 0x01 = no compression, 0x78 0x5E = fast, 0x78 0x9C = default, 0x78 0xDA = best compression
    const isZlib = bytes.length >= 2 && bytes[0] === 0x78 && 
      (bytes[1] === 0x01 || bytes[1] === 0x5E || bytes[1] === 0x9C || bytes[1] === 0xDA);

    if (isZlib) {
      try {
        // Use pako-style manual zlib decompression via DecompressionStream
        // Deno's "deflate" mode expects zlib format with header
        const ds = new DecompressionStream("deflate");
        const writer = ds.writable.getWriter();
        writer.write(new Uint8Array(bytes).buffer as ArrayBuffer);
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
        console.error("Zlib decompression failed:", e);
        // Fall back to raw bytes if decompression fails
        decodedData = bytes;
      }
    } else {
      // Not zlib compressed, use raw decoded bytes
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

    // Decode the data to text for response
    const decodedText = new TextDecoder().decode(decodedData);

    return new Response(
      JSON.stringify({
        success: true,
        file: filePath,
        size: finalData.length,
        appended: !!existingFile,
        decodedText,
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
