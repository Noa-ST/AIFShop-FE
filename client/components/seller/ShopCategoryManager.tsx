import { useState, useEffect } from 'react';
import { shopCategoryService, GetShopCategory } from '@/services/shopCategoryService';
import { ShopErrorHandler } from '@/utils/shopErrorHandler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ShopCategoryTree from './ShopCategoryTree';
import ShopCategoryForm from './ShopCategoryForm';
import { Plus } from 'lucide-react';

export default function ShopCategoryManager() {
  const [categories, setCategories] = useState<GetShopCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GetShopCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<GetShopCategory | null>(null);
  const [defaultParentIdForCreate, setDefaultParentIdForCreate] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAllCounter, setExpandAllCounter] = useState(0);
  const [collapseAllCounter, setCollapseAllCounter] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shopCategoryService.getList();
      if (response.succeeded && response.data) {
        const tree = shopCategoryService.buildTree(response.data);
        setCategories(tree);
      } else {
        setError(response.message || 'Không thể tải danh sách danh mục');
      }
    } catch (err: any) {
      const apiError = ShopErrorHandler.handleShopCategoryError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setDefaultParentIdForCreate(undefined);
    setShowForm(true);
  };

  const handleEdit = (category: GetShopCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      const response = await shopCategoryService.delete(deletingCategory.id);
      if (response.succeeded) {
        await loadCategories();
        setDeletingCategory(null);
      } else {
        const apiError = ShopErrorHandler.handleShopCategoryError({ response: { data: response } });
        alert(apiError.message);
      }
    } catch (err: any) {
      const apiError = ShopErrorHandler.handleShopCategoryError(err);
      alert(apiError.message);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCategory(null);
    setDefaultParentIdForCreate(undefined);
    loadCategories();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setDefaultParentIdForCreate(undefined);
  };

  // Filter tree by name (case-insensitive). Keep parents if any child matches.
  const filterTree = (nodes: GetShopCategory[], term: string): GetShopCategory[] => {
    if (!term.trim()) return nodes;
    const q = term.toLowerCase();
    const walk = (arr: GetShopCategory[]): GetShopCategory[] => {
      const result: GetShopCategory[] = [];
      arr.forEach(node => {
        const nameMatch = node.name.toLowerCase().includes(q);
        const children = node.children ? walk(node.children) : [];
        if (nameMatch || children.length > 0) {
          result.push({ ...node, children: children.length > 0 ? children : undefined });
        }
      });
      return result;
    };
    return walk(nodes);
  };

  if (showForm) {
    return (
      <ShopCategoryForm
        categoryId={editingCategory?.id}
        defaultParentId={defaultParentIdForCreate}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Quản lý danh mục shop</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" onClick={() => setExpandAllCounter(c => c + 1)}>Mở rộng tất cả</Button>
              <Button variant="outline" onClick={() => setCollapseAllCounter(c => c + 1)}>Thu gọn tất cả</Button>
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tạo danh mục mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Đang tải danh mục...</p>
              </div>
            </div>
          ) : (
            <ShopCategoryTree
              categories={filterTree(categories, searchTerm)}
              onSelectCategory={(cat) => {
                // Handle category selection if needed
                console.log('Selected category:', cat);
              }}
              showActions={true}
              onEdit={handleEdit}
              onDelete={(cat) => setDeletingCategory(cat)}
              onAddChild={(parent) => {
                setEditingCategory(null);
                setDefaultParentIdForCreate(parent.id);
                setShowForm(true);
              }}
              expandAllTrigger={expandAllCounter}
              collapseAllTrigger={collapseAllCounter}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục "{deletingCategory?.name}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

