import { createHash, randomUUID } from 'crypto';

const PUBLIC_BUCKET = 'vendor-public';
const PRIVATE_BUCKET = 'vendor-private';

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

export function isSupabaseStorageConfigured() {
  return Boolean(storageConfig());
}

function headers(serviceKey: string, contentType = 'application/json') {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': contentType,
  };
}

async function ensurePublicBucket(url: string, serviceKey: string) {
  const response = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: headers(serviceKey),
    body: JSON.stringify({ id: PUBLIC_BUCKET, name: PUBLIC_BUCKET, public: true, file_size_limit: 4 * 1024 * 1024 }),
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Unable to prepare photo storage (${response.status})`);
  }
}

async function ensurePrivateBucket(url: string, serviceKey: string) {
  const response = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: headers(serviceKey),
    body: JSON.stringify({ id: PRIVATE_BUCKET, name: PRIVATE_BUCKET, public: false, file_size_limit: 8 * 1024 * 1024 }),
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Unable to prepare private storage (${response.status})`);
  }
}

export async function uploadPublicVendorPhoto(email: string, file: File): Promise<string> {
  const config = storageConfig();
  if (!config) throw new Error('Supabase Storage is not configured');
  await ensurePublicBucket(config.url, config.serviceKey);

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const owner = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 24);
  const objectPath = `setup-photos/${owner}/${randomUUID()}.${extension}`;
  const response = await fetch(
    `${config.url}/storage/v1/object/${PUBLIC_BUCKET}/${objectPath}`,
    {
      method: 'POST',
      headers: headers(config.serviceKey, file.type),
      body: Buffer.from(await file.arrayBuffer()),
    }
  );
  if (!response.ok) throw new Error(`Photo upload failed (${response.status})`);
  return `${config.url}/storage/v1/object/public/${PUBLIC_BUCKET}/${objectPath}`;
}

export async function uploadPrivateVendorFile(email: string, file: File): Promise<string> {
  const config = storageConfig();
  if (!config) throw new Error('Supabase Storage is not configured');
  await ensurePrivateBucket(config.url, config.serviceKey);
  const owner = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 24);
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || 'bin';
  const objectPath = `receipts/${owner}/${randomUUID()}.${extension}`;
  const response = await fetch(`${config.url}/storage/v1/object/${PRIVATE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: headers(config.serviceKey, file.type || 'application/octet-stream'),
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!response.ok) throw new Error(`Receipt upload failed (${response.status})`);
  return `${PRIVATE_BUCKET}/${objectPath}`;
}

export async function deletePrivateVendorFile(reference: string) {
  const config = storageConfig();
  if (!config || !reference.startsWith(`${PRIVATE_BUCKET}/`)) return;
  const objectPath = reference.slice(PRIVATE_BUCKET.length + 1);
  await fetch(`${config.url}/storage/v1/object/${PRIVATE_BUCKET}`, {
    method: 'DELETE',
    headers: headers(config.serviceKey),
    body: JSON.stringify({ prefixes: [objectPath] }),
  });
}
