import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: 'Supabase not configured. Set environment variables first.' }), { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const fileName = formData.get('fileName') as string | null;
  const fileType = formData.get('fileType') as string | null;
  const fileSize = formData.get('fileSize') as string | null;

  if (!file || !fileName) {
    return new Response(JSON.stringify({ error: 'Missing file data' }), { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const storagePath = `documents/${crypto.randomUUID()}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error: storageError } = await supabase.storage
    .from('knowledge-files')
    .upload(storagePath, arrayBuffer, {
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (storageError) {
    return new Response(JSON.stringify({ error: `Storage error: ${storageError.message}` }), { status: 500 });
  }

  const { data: doc, error: dbError } = await supabase
    .from('knowledge_documents')
    .insert({
      file_name: fileName,
      file_type: fileType ?? 'application/octet-stream',
      file_size: parseInt(fileSize ?? '0', 10),
      storage_path: storagePath,
      status: 'uploaded',
    })
    .select()
    .single();

  if (dbError) {
    return new Response(JSON.stringify({ error: `Database error: ${dbError.message}` }), { status: 500 });
  }

  await supabase.from('knowledge_audit_log').insert({
    action: 'upload',
    target_type: 'document',
    target_id: doc.id,
    metadata: { file_name: fileName, file_size: fileSize },
  });

  return new Response(JSON.stringify({ document: doc }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
