'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, X, Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategoryStore } from '@/stores/category';
import { useToast } from '@/hooks/use-toast';
import { DiaryCategory } from '@/types/category';

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (category: DiaryCategory) => void;
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
  onCategoryCreated,
}: CategoryManagerDialogProps) {
  const {
    categories,
    isLoading,
    isSubmitting,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    error,
  } = useCategoryStore();
  const { toast } = useToast();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (open) {
      fetchCategories();
      clearError();
      setNewCategoryName('');
      setEditingCategoryId(null);
      setEditingName('');
    }
  }, [open, fetchCategories, clearError]);

  useEffect(() => {
    if (error) {
      toast({
        title: '오류가 발생했습니다',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCategoryName.trim()) return;

    const created = await createCategory(newCategoryName.trim());
    if (created) {
      toast({
        title: '카테고리가 추가되었습니다.',
        description: `"${created.name}" 카테고리가 생성되었습니다.`,
      });
      setNewCategoryName('');
      onCategoryCreated?.(created);
    }
  };

  const startEditing = (category: DiaryCategory) => {
    setEditingCategoryId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditingName('');
  };

  const handleUpdate = async () => {
    if (!editingCategoryId) return;
    if (!editingName.trim()) {
      toast({
        title: '카테고리 이름을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const updated = await updateCategory(editingCategoryId, editingName.trim());
    if (updated) {
      toast({
        title: '카테고리가 수정되었습니다.',
        description: `"${updated.name}"으로 변경되었습니다.`,
      });
      setEditingCategoryId(null);
      setEditingName('');
    }
  };

  const handleDelete = async (category: DiaryCategory) => {
    const confirmed = window.confirm(
      `"${category.name}" 카테고리를 삭제하시겠습니까?\n연결된 다이어리는 분류 없음 상태로 남습니다.`,
    );
    if (!confirmed) return;

    const success = await deleteCategory(category.id);
    if (success) {
      toast({
        title: '카테고리가 삭제되었습니다.',
        description: '다이어리는 카테고리 없이 유지됩니다.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>다이어리 카테고리 관리</DialogTitle>
          <DialogDescription>
            새로운 다이어리를 만들거나 이름을 변경하고, 더 이상 사용하지 않는
            카테고리를 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="새 다이어리 이름"
              maxLength={255}
            />
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              추가
            </Button>
          </form>

          <ScrollArea className="max-h-72">
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-text-tertiary">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 불러오는
                  중...
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-subtle py-10 text-center text-sm text-text-tertiary">
                  아직 생성된 다이어리가 없습니다. 상단에서 새 다이어리를
                  추가해보세요.
                </div>
              ) : (
                categories.map((category) => {
                  const isEditing = editingCategoryId === category.id;
                  return (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-3"
                    >
                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(event) =>
                            setEditingName(event.target.value)
                          }
                          maxLength={255}
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {category.name}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            생성{' '}
                            {new Date(category.created_at).toLocaleDateString(
                              'ko-KR',
                            )}
                          </div>
                        </div>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleUpdate}
                              disabled={isSubmitting}
                              title="저장"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEditing}
                              title="취소"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(category)}
                              title="이름 수정"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(category)}
                              title="삭제"
                              className="text-red-500 hover:text-red-600"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
