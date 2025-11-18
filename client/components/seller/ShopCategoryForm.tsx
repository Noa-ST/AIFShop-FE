import { useState, useEffect } from 'react';
import { shopCategoryService, CreateShopCategory, UpdateShopCategory, GetShopCategory } from '@/services/shopCategoryService';
import { ShopErrorHandler } from '@/utils/shopErrorHandler';
import { ShopCategoryValidator } from '@/utils/shopValidator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ShopCategoryTree from './ShopCategoryTree';

interface ShopCategoryFormProps {
  categoryId?: string; // Edit mode if provided
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultParentId?: string; // preselect parent when creating
}

export default function ShopCategoryForm({ categoryId, onSuccess, onCancel, defaultParentId }: ShopCategoryFormProps) {
  const [formData, setFormData] = useState<CreateShopCategory>({
    name: '',
    description: '',
    parentId: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<GetShopCategory[]>([]);

  useEffect(() => {
    loadCategories();
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  // Preselect parent when creating new
  useEffect(() => {
    if (!categoryId && defaultParentId) {
      setSelectedParentId(defaultParentId);
      setFormData((prev) => ({ ...prev, parentId: defaultParentId }));
    }
  }, [defaultParentId, categoryId]);

  const loadCategories = async () => {
    try {
      const response = await shopCategoryService.getList();
      if (response.succeeded && response.data) {
        // Get flat array and build tree
        const tree = shopCategoryService.buildTree(response.data);
        setCategories(tree);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      const apiError = ShopErrorHandler.handleShopCategoryError(error);
      setErrors({ general: apiError.message });
    }
  };

  const loadCategory = async () => {
    if (!categoryId) return;
    
    try {
      const response = await shopCategoryService.getById(categoryId);
      if (response.succeeded && response.data) {
        const cat = response.data;
        setFormData({
          name: cat.name,
          description: cat.description || '',
          parentId: cat.parentId || undefined,
        });
        setSelectedParentId(cat.parentId);
      }
    } catch (error: any) {
      console.error('Error loading category:', error);
      const apiError = ShopErrorHandler.handleShopCategoryError(error);
      setErrors({ general: apiError.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    let validationErrors: Record<string, string>;
    if (categoryId) {
      const updateData: UpdateShopCategory = {
        id: categoryId,
        ...formData,
      };
      validationErrors = ShopCategoryValidator.validateUpdate(updateData) as any;
    } else {
      validationErrors = ShopCategoryValidator.validateCreate(formData) as any;
    }

    if (ShopCategoryValidator.hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (categoryId) {
        const updateData: UpdateShopCategory = {
          id: categoryId,
          ...formData,
        };
        response = await shopCategoryService.update(categoryId, updateData);
      } else {
        response = await shopCategoryService.create(formData);
      }

      if (response.succeeded) {
        onSuccess?.();
        if (!categoryId) {
          // Reset form for create mode
          setFormData({ name: '', description: '', parentId: undefined });
          setSelectedParentId(null);
        }
      } else {
        const apiError = ShopErrorHandler.handleShopCategoryError({ response: { data: response } });
        setErrors({ general: apiError.message });
      }
    } catch (error: any) {
      const apiError = ShopErrorHandler.handleShopCategoryError(error);
      setErrors({ general: apiError.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParent = (category: GetShopCategory) => {
    // Don't allow selecting itself in edit mode
    if (categoryId && category.id === categoryId) {
      setErrors({ general: 'Không thể chọn chính danh mục này làm cha' });
      return;
    }

    setSelectedParentId(category.id);
    setFormData({ ...formData, parentId: category.id });
    setErrors({});
  };

  const handleRemoveParent = () => {
    setSelectedParentId(null);
    setFormData({ ...formData, parentId: undefined });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{categoryId ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Tên danh mục <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              maxLength={100}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              maxLength={500}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              {formData.description?.length || 0}/500
            </p>
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label>Danh mục cha (tùy chọn)</Label>
            <div className="border rounded-lg p-4 max-h-64 overflow-auto">
              <ShopCategoryTree
                categories={categories}
                onSelectCategory={handleSelectParent}
                selectedCategoryId={selectedParentId || undefined}
                excludeId={categoryId}
                showActions={false}
              />
            </div>
            {selectedParentId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveParent}
              >
                Xóa danh mục cha
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Đang lưu...' : categoryId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

