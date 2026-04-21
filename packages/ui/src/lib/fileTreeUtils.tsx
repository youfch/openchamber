/* eslint-disable react-refresh/only-export-components -- Utility module exporting types and helpers */
import React from 'react';

import { FileTypeIcon } from '@/components/icons/FileTypeIcon';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  relativePath?: string;
};

export type FileStatus = 'open' | 'modified' | 'git-modified' | 'git-added' | 'git-deleted';

// ─────────────────────────────────────────────────────────────
// Path utilities
// ─────────────────────────────────────────────────────────────

export const normalizePath = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';

  let normalized = raw.replace(/\\/g, '/');

  // Collapse multiple consecutive slashes but preserve leading `//` for UNC paths.
  normalized = normalized.replace(/(?!^)\/+/g, '/');

  // Remove trailing slashes, but preserve unix root `/`, Windows drive root `X:/`, and UNC root `//`
  if (normalized !== '/' && normalized !== '//' && !/^[A-Za-z]:\/$/.test(normalized)) {
    normalized = normalized.replace(/\/+$/, '');
  }

  // If input was purely slashes (e.g. `///`), return the bare root.
  if (normalized === '') {
    return raw.startsWith('/') ? '/' : '';
  }

  return normalized;
};

export const isAbsolutePath = (value: string): boolean => {
  return value.startsWith('/') || value.startsWith('//') || /^[A-Za-z]:\//.test(value);
};

export const getRelativePath = (root: string, path: string): string => {
  const normalizedPath = normalizePath(path);
  const normalizedRoot = normalizePath(root).replace(/\/+$/, '');
  if (normalizedPath === normalizedRoot) {
    return '.';
  }
  if (!normalizedRoot || !normalizedPath.startsWith(`${normalizedRoot}/`)) {
    return normalizedPath;
  }
  return normalizedPath.slice(normalizedRoot.length + 1);
};

// ─────────────────────────────────────────────────────────────
// Filtering
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if the entry should be excluded from the file tree
 * based on dotfile visibility.  Applied client-side because the
 * server does not filter dotfiles.
 */
export const isDotfileHidden = (name: string, showHidden: boolean): boolean => {
  return !showHidden && name.startsWith('.');
};

// ─────────────────────────────────────────────────────────────
// Sorting
// ─────────────────────────────────────────────────────────────

export const sortNodes = (items: FileNode[]) =>
  items.slice().sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

// ─────────────────────────────────────────────────────────────
// Icon helper
// ─────────────────────────────────────────────────────────────

export const getFileIcon = (filePath: string, extension?: string): React.ReactNode => {
  return <FileTypeIcon filePath={filePath} extension={extension} />;
};

// ─────────────────────────────────────────────────────────────
// Status indicator
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<FileStatus, string> = {
  open: 'var(--status-info)',
  modified: 'var(--status-warning)',
  'git-modified': 'var(--status-warning)',
  'git-added': 'var(--status-success)',
  'git-deleted': 'var(--status-error)',
};

export const FileStatusDot: React.FC<{ status: FileStatus }> = ({ status }) => (
  <span
    className="h-2 w-2 rounded-full"
    style={{ backgroundColor: STATUS_COLORS[status] }}
  />
);

// ─────────────────────────────────────────────────────────────
// Pure mapping function (wrappable in useCallback by consumers)
// ─────────────────────────────────────────────────────────────

export const mapDirectoryEntries = (
  dirPath: string,
  entries: Array<{ name: string; path: string; isDirectory: boolean }>,
  showHidden: boolean,
): FileNode[] => {
  const nodes = entries
    .filter((entry) =>
      entry && typeof entry.name === 'string' && entry.name.length > 0
    )
    .filter((entry) => showHidden || !entry.name.startsWith('.'))
    .map<FileNode>((entry) => {
      const name = entry.name;
      const normalizedEntryPath = normalizePath(entry.path || '');
      const path = normalizedEntryPath
        ? (isAbsolutePath(normalizedEntryPath)
          ? normalizedEntryPath
          : normalizePath(`${dirPath}/${normalizedEntryPath}`))
        : normalizePath(`${dirPath}/${name}`);
      const type = entry.isDirectory ? 'directory' : 'file';
      const extension = type === 'file' && name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined;
      return { name, path, type, extension };
    });

  return sortNodes(nodes);
};
