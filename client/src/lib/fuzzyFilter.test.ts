import { describe, it, expect } from 'vitest';
import { fuzzyFilter } from './fuzzyFilter';

type Item = { id: string; name: string };

const items: Item[] = [
  { id: '1', name: 'Bank' },
  { id: '2', name: 'Cash' },
  { id: '3', name: 'Savings' },
  { id: '4', name: 'Salary' },
];

describe('fuzzyFilter', () => {
  it('returns all items in order when query is empty', () => {
    expect(fuzzyFilter(items, '', (i) => i.name)).toEqual(items);
  });

  it('returns all items in order when query is whitespace', () => {
    expect(fuzzyFilter(items, '   ', (i) => i.name)).toEqual(items);
  });

  it('matches order-preserving fuzzy characters', () => {
    const result = fuzzyFilter(items, 'bk', (i) => i.name);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bank');
  });

  it('does not match when characters are out of order', () => {
    const result = fuzzyFilter(items, 'ab', (i) => i.name);
    expect(result).toHaveLength(0);
  });

  it('matches case-insensitively', () => {
    const result = fuzzyFilter(items, 'SAL', (i) => i.name);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Salary');
  });

  it('excludes non-matching items', () => {
    const result = fuzzyFilter(items, 'xyz', (i) => i.name);
    expect(result).toHaveLength(0);
  });

  it('matches multiple items when applicable', () => {
    const result = fuzzyFilter(items, 'a', (i) => i.name);
    expect(result.map((i) => i.name)).toEqual(['Bank', 'Cash', 'Savings', 'Salary']);
  });
});
