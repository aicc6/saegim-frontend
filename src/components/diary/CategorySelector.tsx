'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Layers, Loader2, NotebookPen, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { DiaryCategory } from '@/types/category';
import { useCategoryStore } from '@/stores/category';
import { CategoryManagerDialog } from './CategoryManagerDialog';

interface CategorySelectorProps {
  value: string | null;
  onChange: (
    categoryId: string | null,
    category?: DiaryCategory | null,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
  className?: string;
  allowManage?: boolean;
  label?: string;
}

export function CategorySelector({
  value,
  onChange,
  placeholder = '(분류 없음)',
  disabled,
  triggerClassName,
  className,
  allowManage = true,
  label,
}: CategorySelectorProps) {
  const { categories, fetchCategories, isLoading } = useCategoryStore();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === value) ?? null,
    [categories, value],
  );

  const handleSelect = (categoryId: string | null) => {
    const category = categoryId
      ? (categories.find((item) => item.id === categoryId) ?? null)
      : null;
    onChange(categoryId, category ?? null);
    setPopoverOpen(false);
  };

  const handleCategoryCreated = (category: DiaryCategory) => {
    onChange(category.id, category);
    setManagerOpen(false);
    setPopoverOpen(false);
  };

  const renderTriggerLabel = () => {
    if (selectedCategory) return selectedCategory.name;
    return placeholder;
  };

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 text-sm font-medium text-text-secondary">
          {label}
        </div>
      )}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            disabled={disabled}
            className={cn(
              'w-full justify-between border-border-subtle text-left text-sm',
              !selectedCategory && 'text-text-tertiary',
              triggerClassName,
            )}
          >
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {renderTriggerLabel()}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="카테고리 검색" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-text-tertiary">
                    <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중...
                  </div>
                ) : (
                  '카테고리가 없습니다. 새로 추가해보세요.'
                )}
              </CommandEmpty>
              <CommandGroup heading="다이어리 목록">
                <CommandItem
                  value="__none__"
                  onSelect={() => handleSelect(null)}
                  className={cn(
                    'flex items-center gap-2',
                    value === null && 'bg-sage-10',
                  )}
                >
                  <NotebookPen className="h-4 w-4" />
                  (분류 없음)
                </CommandItem>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleSelect(category.id)}
                    className={cn(
                      'flex items-center gap-2',
                      value === category.id && 'bg-sage-10',
                    )}
                  >
                    <span className="truncate">{category.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {allowManage && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setManagerOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> 새 다이어리 만들기
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {allowManage && (
        <CategoryManagerDialog
          open={managerOpen}
          onOpenChange={setManagerOpen}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </div>
  );
}
