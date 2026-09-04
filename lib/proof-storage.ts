import { getSafeSession, supabase } from './supabase';
import type { ApiResult } from './types';

const PROOF_PHOTO_BUCKET = 'proof-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface ProofPhotoAsset {
  uri: string;
  fileName?: string | null;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  file?: Blob;
}

export interface ProofPhotoUpload {
  bucket: string;
  path: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90) || 'photo-proof.jpg';
}

function inferMimeType(asset: ProofPhotoAsset): string {
  if (asset.mimeType?.startsWith('image/')) return asset.mimeType;

  const name = asset.fileName?.toLowerCase() || asset.uri.toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.heic')) return 'image/heic';
  if (name.endsWith('.heif')) return 'image/heif';

  return 'image/jpeg';
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('heic')) return 'heic';
  if (mimeType.includes('heif')) return 'heif';
  return 'jpg';
}

async function getUploadBody(asset: ProofPhotoAsset): Promise<Blob | ArrayBuffer> {
  if (asset.file) return asset.file;

  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Unable to read the selected photo.');
  return response.arrayBuffer();
}

export async function uploadProofPhoto(
  questId: string,
  asset: ProofPhotoAsset
): Promise<ApiResult<ProofPhotoUpload>> {
  try {
    const { session } = await getSafeSession();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: 'Unauthorized' };

    const mimeType = inferMimeType(asset);
    const extension = extensionForMime(mimeType);
    const fileName = sanitizeFileName(asset.fileName || `photo-proof.${extension}`);
    const hasExtension = /\.[a-z0-9]+$/i.test(fileName);
    const storedName = hasExtension ? fileName : `${fileName}.${extension}`;
    const path = `${userId}/${questId}/${Date.now()}-${storedName}`;
    const uploadBody = await getUploadBody(asset);

    const { error: uploadError } = await supabase.storage
      .from(PROOF_PHOTO_BUCKET)
      .upload(path, uploadBody, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: signedData, error: signedError } = await supabase.storage
      .from(PROOF_PHOTO_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (signedError || !signedData?.signedUrl) {
      return { success: false, error: signedError?.message || 'Unable to create proof photo URL.' };
    }

    return {
      success: true,
      data: {
        bucket: PROOF_PHOTO_BUCKET,
        path,
        url: signedData.signedUrl,
        fileName: storedName,
        mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown photo upload error';
    return { success: false, error: message };
  }
}
