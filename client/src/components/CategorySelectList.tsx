import type { CategoryData } from '../api/categories';

interface CategorySelectListProps {
  categories: CategoryData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategorySelectList({
  _categories,
  _selectedId,
  _onSelect,
}: CategorySelectListProps): JSX.Element {
  return <div data-testid="category-select-list" />;
}
