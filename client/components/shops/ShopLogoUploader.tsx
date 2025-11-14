import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShopLogoUploaderProps {
  value?: string;
  onChange: (logoUrl: string) => void;
  className?: string;
}

export default function ShopLogoUploader({ value, onChange, className }: ShopLogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)' };
    }

    // Check file size (max 2.5MB)
    const maxSize = 2.5 * 1024 * 1024; // 2.5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Kích thước ảnh không được vượt quá 2.5MB' };
    }

    return { valid: true };
  };

  const compressImage = async (file: File, maxWidth: number = 512, quality: number = 0.9): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      // Compress image
      const compressedFile = await compressImage(file, 512, 0.9); // 512px width for logo

      // Convert to Base64
      const base64 = await fileToBase64(compressedFile);

      setPreview(base64);
      onChange(base64);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Lỗi khi xử lý logo. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className={cn("logo-uploader space-y-2", className)}>
      {preview && (
        <div className="logo-preview relative inline-block">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
            <img 
              src={preview} 
              alt="Shop logo preview" 
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="logo-upload">
          Logo Shop
        </Label>
        <Input
          id="logo-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="cursor-pointer"
        />
        <p className="text-xs text-gray-500">
          Logo nên là hình vuông, tối đa 512x512px, dung lượng &lt; 2.5MB
        </p>
        {uploading && (
          <p className="text-xs text-blue-600">Đang xử lý...</p>
        )}
      </div>
    </div>
  );
}

