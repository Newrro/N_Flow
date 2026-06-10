'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './Table.module.css';

export interface Column<T> {
  key?: string;
  accessor?: string;
  label?: string;
  header?: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  isRowSelected?: (row: T) => boolean;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

type SortDir = 'asc' | 'desc';

// Helper to get the column key (supports both 'key' and 'accessor')
function getColKey<T>(col: Column<T>): string {
  return col.key || col.accessor || '';
}

// Helper to get the column label (supports both 'label' and 'header')
function getColLabel<T>(col: Column<T>): string {
  return col.label || col.header || '';
}

// Helper to get row value by key
function getRowValue<T extends object>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export default function Table<T extends object>({
  columns,
  data,
  onRowClick,
  isRowSelected,
  loading = false,
  emptyMessage = 'No data available',
  searchable = false,
  searchPlaceholder = 'Search…',
}: TableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const key = getColKey(col);
        const v = getRowValue(row, key);
        return v != null && String(v).toLowerCase().includes(term);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getRowValue(a, sortKey);
      const bv = getRowValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === 'asc' ? -1 : 1;
      if (bv == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === 'asc' ? -1 : 1;
      if (as > bs) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  return (
    <div className={styles.wrapper}>
      {searchable && (
        <div className={styles.searchBar}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear">
              &times;
            </button>
          )}
        </div>
      )}

      <div className={styles.scrollContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {columns.map((col, ci) => {
                const colKey = getColKey(col);
                const active = sortKey === colKey;
                return (
                  <th
                    key={`col-${ci}`}
                    className={[styles.th, ci === 0 ? styles.stickyCol : '', col.sortable ? styles.sortable : ''].filter(Boolean).join(' ')}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    onClick={col.sortable ? () => handleSort(colKey) : undefined}
                  >
                    <span className={styles.thContent}>
                      <span>{getColLabel(col)}</span>
                      {col.sortable && (
                        <span className={styles.sortIndicator}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 2L9 5.5H3L6 2Z" fill={active && sortDir === 'asc' ? 'var(--color-primary-600)' : 'var(--color-gray-300)'} />
                            <path d="M6 10L3 6.5H9L6 10Z" fill={active && sortDir === 'desc' ? 'var(--color-primary-600)' : 'var(--color-gray-300)'} />
                          </svg>
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {loading
              ? Array.from({ length: 6 }).map((_, ri) => (
                  <tr key={ri} className={styles.tr}>
                    {columns.map((col, ci) => (
                      <td key={`skel-${ci}`} className={[styles.td, ci === 0 ? styles.stickyCol : ''].filter(Boolean).join(' ')}>
                        <span className={styles.skeleton} />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.length === 0
                ? (
                    <tr>
                      <td colSpan={columns.length} className={styles.emptyCell}>
                        <div className={styles.emptyState}>
                          <span className={styles.emptyText}>{emptyMessage}</span>
                        </div>
                      </td>
                    </tr>
                  )
                : sorted.map((row, ri) => (
                    <tr
                      key={ri}
                      className={[styles.tr, ri % 2 === 1 ? styles.striped : '', onRowClick ? styles.clickable : '', isRowSelected?.(row) ? styles.selected : ''].filter(Boolean).join(' ')}
                      onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
                    >
                      {columns.map((col, ci) => {
                        const colKey = getColKey(col);
                        const value = getRowValue(row, colKey);
                        return (
                          <td key={`cell-${ci}`} className={[styles.td, ci === 0 ? styles.stickyCol : ''].filter(Boolean).join(' ')}>
                            {col.render
                              ? col.render(row, ri)
                              : value != null
                                ? String(value)
                                : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>

      {searchable && !loading && search && (
        <div className={styles.resultCount}>
          {sorted.length} result{sorted.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
}
