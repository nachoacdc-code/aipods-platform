import { useState, useCallback, useRef } from 'react';
import { encryptBlob, packEncrypted } from '../../lib/encryption';

interface Props {
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json',
];

type UploadState = 'idle' | 'encrypting' | 'uploading' | 'done' | 'error';

export default function FileUpload({ onUploadComplete }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError('');

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 50 MB.`);
      return;
    }

    try {
      setState('encrypting');
      setProgress(`Encrypting ${file.name}...`);

      const raw = await file.arrayBuffer();
      const { encrypted, iv } = await encryptBlob(raw);
      const packed = packEncrypted(encrypted, iv);

      setState('uploading');
      setProgress(`Uploading ${file.name}...`);

      const formData = new FormData();
      formData.append('file', new Blob([packed], { type: 'application/octet-stream' }));
      formData.append('fileName', file.name);
      formData.append('fileType', file.type || 'application/octet-stream');
      formData.append('fileSize', String(file.size));

      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Upload failed');
      }

      setState('done');
      setProgress(`${file.name} uploaded successfully.`);
      onUploadComplete?.();

      setTimeout(() => {
        setState('idle');
        setProgress('');
      }, 3000);
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Upload failed');
      setProgress('');
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [uploadFile]);

  const isProcessing = state === 'encrypting' || state === 'uploading';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
        py-16 text-center transition cursor-pointer
        ${dragOver
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]'
        }
        ${isProcessing ? 'pointer-events-none opacity-70' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleChange}
      />

      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
        {state === 'encrypting' ? '🔐' : state === 'uploading' ? '☁️' : state === 'done' ? '✅' : '📄'}
      </div>

      {progress ? (
        <p className="text-sm text-zinc-300">{progress}</p>
      ) : (
        <>
          <p className="mb-1 text-sm font-medium text-zinc-300">
            Drop files here or <span className="text-blue-400">browse</span>
          </p>
          <p className="text-xs text-zinc-600">
            PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON, Markdown · Max 50 MB
          </p>
          <p className="mt-3 text-xs text-zinc-700">
            Files are encrypted in your browser before upload
          </p>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
