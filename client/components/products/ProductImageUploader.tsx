import { useState, useEffect } from 'react';
import ImageUploader from '@/utils/imageUploader';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
}

export default function ProductImageUploader({
  onImagesChange,
  maxImages = 10,
  existingImages = [],
}: ProductImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Update images when existingImages prop changes
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setImages(existingImages);
    } else if (existingImages && existingImages.length === 0) {
      // Reset to empty if explicitly passed as empty array
      setImages([]);
    }
  }, [existingImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate total images
    if (images.length + files.length > maxImages) {
      setError(`Tối đa ${maxImages} ảnh. Bạn đã chọn quá nhiều.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Validate all files
      for (const file of files) {
        const validation = ImageUploader.validateImage(file);
        if (!validation.valid) {
          setError(validation.error || 'File không hợp lệ');
          setUploading(false);
          return;
        }
      }

      // Compress images (optional - can be disabled if not needed)
      const compressedFiles = await Promise.all(
        files.map(file => ImageUploader.compressImage(file))
      );

      // Convert to Base64
      const base64Images = await ImageUploader.filesToBase64(compressedFiles);
      
      const newImages = [...images, ...base64Images];
      setImages(newImages);
      onImagesChange(newImages);
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setError('Lỗi khi tải ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={image}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Xóa ảnh"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Ảnh {index + 1}
            </div>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-rose-500 cursor-pointer flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="text-center p-4">
              {uploading ? (
                <div className="text-sm text-gray-600">Đang tải...</div>
              ) : (
                <>
                  <div className="text-2xl mb-2">+</div>
                  <div className="text-sm text-gray-600">
                    Thêm ảnh
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {images.length}/{maxImages}
                  </div>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500">
          Chấp nhận: JPEG, PNG, WebP. Tối đa 5MB/ảnh. Tối đa {maxImages} ảnh.
        </p>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Chưa có ảnh nào được chọn
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            disabled={uploading}
          >
            Chọn ảnh
          </Button>
        </div>
      )}
    </div>
  );
}
