import axiosClient from '@/services/axiosClient';

// Phát hiện chuỗi data URL (base64 có header)
export const isBase64Image = (s: string) =>
  typeof s === 'string' && s.startsWith('data:image/');

// Chuyển data URL thành File để gửi multipart
function dataUrlToFile(dataUrl: string, index: number): File | null {
  if (!isBase64Image(dataUrl)) return null;
  try {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/^data:([^;]+);base64/i);
    const mime = mimeMatch?.[1] || 'image/png';
    const ext = mime.split('/')[1] || 'png';
    const name = `image_${index}.${ext}`;
    const byteString = atob(base64);
    const len = byteString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = byteString.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return new File([blob], name, { type: mime });
  } catch {
    return null;
  }
}

// Bỏ header data URL để lấy phần base64 thuần
function stripDataUrlHeader(dataUrl: string): string {
  if (typeof dataUrl !== 'string') return dataUrl as any;
  const hasHeader = dataUrl.startsWith('data:image/');
  return hasHeader ? dataUrl.split(',')[1] ?? dataUrl : dataUrl;
}

/**
 * Upload ảnh base64 theo đúng hợp đồng backend:
 * - Một ảnh: POST `/api/upload` với JSON body `{ Base64, Folder? }`
 * - Nhiều ảnh: POST `/api/upload/batch` với multipart/form-data, field `Images` (IFormFile[]), `Folder?`
 * Trả về mảng URL.
 */
export async function uploadBase64Images(
  images: string[],
  opts?: { folder?: string }
): Promise<string[]> {
  if (!images || images.length === 0) return [];
  const folder = opts?.folder;

  // Một ảnh: dùng JSON, đúng schema `{ Base64, Folder? }`
  if (images.length === 1) {
    const body: any = { Base64: images[0] };
    if (folder) body.Folder = folder;

    try {
      const res = await axiosClient.post('/api/upload', body);
      const payload = res?.data ?? {};
      const singleUrl: string | undefined =
        (payload?.data as string) || payload?.url || payload?.data?.url;
      if (!singleUrl || typeof singleUrl !== 'string') {
        throw new Error('Upload ảnh thất bại: phản hồi không hợp lệ');
      }
      return [singleUrl];
    } catch (err: any) {
      const d = err?.response?.data;
      console.warn('[Upload single JSON] error:', d || err?.message || err);
      throw err;
    }
  }

  // Nhiều ảnh: multipart với field chính xác `Images` (IFormFile[])
  const files: File[] = [];
  images.forEach((img, idx) => {
    const f = dataUrlToFile(img, idx);
    // Nếu không có header, fallback tạo file PNG (best-effort)
    if (!f && typeof img === 'string') {
      try {
        const base64 = stripDataUrlHeader(img);
        const byteString = atob(base64);
        const len = byteString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = byteString.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'image/png' });
        files.push(new File([blob], `image_${idx}.png`, { type: 'image/png' }));
      } catch {}
    } else if (f) {
      files.push(f);
    }
  });

  if (files.length === 0) {
    throw new Error('Không thể tạo IFormFile từ dữ liệu đầu vào');
  }
  if (files.length > 10) {
    throw new Error('Vượt quá giới hạn 10 ảnh mỗi yêu cầu');
  }

  const fd = new FormData();
  files.forEach((f) => fd.append('Images', f));
  if (folder) fd.append('Folder', folder);

  try {
    // Xóa header Content-Type để trình duyệt tự set boundary multipart
    const res = await axiosClient.post('/api/upload/batch', fd, {
      headers: { 'Content-Type': undefined },
    });
    const payload = res?.data ?? {};
    const urls: string[] | undefined =
      (Array.isArray(payload?.data) ? payload?.data : undefined) ||
      payload?.urls || payload?.data?.urls;
    if (!urls || !Array.isArray(urls)) {
      throw new Error('Upload ảnh thất bại: phản hồi không hợp lệ');
    }
    return urls;
  } catch (err: any) {
    const d = err?.response?.data;
    console.warn('[Upload batch multipart] error:', d || err?.message || err);
    throw err;
  }
}