import axiosClient from '@/services/axiosClient';

export interface UploadImagesResponse {
  urls: string[];
}

export async function uploadBase64Images(images: string[]): Promise<string[]> {
  if (!images || images.length === 0) return [];
  // Strip data URL header so backend receives pure base64 strings
  const stripped = images.map(stripDataUrlHeader);

  const attempts: Array<any> = [
    { images: stripped },
    { base64Images: stripped },
    { imageBase64s: stripped },
    { imagesBase64: stripped },
    { data: stripped },
    stripped, // top-level array body
    { base64Image: stripped[0] }, // single image
    { image: stripped[0] },
  ];

  let lastErr: any = null;
  let data: any = null;
  for (const body of attempts) {
    try {
      const res = await axiosClient.post('/api/upload', body);
      data = res?.data;
      break;
    } catch (err: any) {
      lastErr = err;
      // Log useful info to console to identify required schema
      try {
        const d = err?.response?.data;
        console.warn('[Upload 400] body keys:', Array.isArray(body) ? '[array]' : Object.keys(body));
        if (d) console.warn('[Upload 400] response:', d);
      } catch {}
      // Only continue for 400; otherwise stop immediately
      if (err?.response?.status !== 400) break;
    }
  }
  if (!data) throw lastErr || new Error('Upload ảnh thất bại');

  const urls =
    data?.urls ||
    data?.data?.urls ||
    (Array.isArray(data?.data) ? data?.data : null) ||
    (Array.isArray(data) ? data : null);

  if (!urls || !Array.isArray(urls)) {
    throw new Error('Upload ảnh thất bại: phản hồi không hợp lệ');
  }
  return urls;
}

export const isBase64Image = (s: string) =>
  typeof s === 'string' && s.startsWith('data:image/');

function stripDataUrlHeader(dataUrl: string): string {
  if (typeof dataUrl !== 'string') return dataUrl as any;
  const hasHeader = dataUrl.startsWith('data:image/');
  return hasHeader ? dataUrl.split(',')[1] ?? dataUrl : dataUrl;
}