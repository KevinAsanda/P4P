import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Uploads a Base64 proof of delivery image/signature to Supabase Storage.
 * Ensures the `delivery-proofs` public bucket exists, then saves the binary file.
 * Returns the public HTTPS URL to be saved in Delivery.proofOfDeliveryUrl.
 */
export async function uploadDeliveryProof(
  orderId: string,
  base64DataUrl: string
): Promise<string> {
  // If it's already an HTTPS URL (not a base64 Data URL), return as-is
  if (!base64DataUrl.startsWith('data:image/')) {
    return base64DataUrl;
  }

  const adminClient = createAdminClient();
  const bucketName = 'delivery-proofs';

  // 1. Ensure bucket exists or create it as a public bucket
  const { data: buckets } = await adminClient.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucketName);

  if (!bucketExists) {
    const { error: createBucketError } = await adminClient.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB limit
    });
    if (createBucketError) {
      console.warn('[Storage] Could not create bucket automatically:', createBucketError.message);
    }
  }

  // 2. Extract content type and convert Base64 to Buffer
  const match = base64DataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid Base64 image data URL format.');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const extension = mimeType.split('/')[1] || 'png';
  const fileName = `${orderId}-${Date.now()}.${extension}`;
  const fileBuffer = Buffer.from(base64Data, 'base64');

  // 3. Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error('[Storage] Proof of delivery upload failed:', uploadError.message);
    throw new Error(`Failed to upload proof of delivery: ${uploadError.message}`);
  }

  // 4. Retrieve public URL
  const { data: publicUrlData } = adminClient.storage
    .from(bucketName)
    .getPublicUrl(uploadData.path);

  return publicUrlData.publicUrl;
}
