import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getCategories, type CategoryData } from '../api/categories';
import { CATEGORIES_KEY } from '../lib/queryKeys';

export function useCategoriesQuery(): UseQueryResult<CategoryData[], Error> {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => getCategories().then((r) => r.categories),
  });
}
