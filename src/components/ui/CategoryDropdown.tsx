'use client';

import { useState } from 'react';
import { ALL_CATEGORIES } from '@/constants/categories';

interface CategoryDropdownProps {
  value: string;
  onChange: (category: string) => void;
  customCategories: string[];
  onAddCategory: (category: string) => void;
}

export function CategoryDropdown({
  value,
  onChange,
  customCategories,
  onAddCategory,
}: CategoryDropdownProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const allOptions = [...ALL_CATEGORIES, ...customCategories];

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !allOptions.includes(trimmed)) {
      onAddCategory(trimmed);
      onChange(trimmed);
    }
    setNewCategory('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="flex gap-1">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
            if (e.key === 'Escape') setIsAdding(false);
          }}
          placeholder="Nama kategori..."
          className="border rounded px-2 py-1 text-sm w-32"
          autoFocus
        />
        <button
          onClick={handleAdd}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === '__add__') {
          setIsAdding(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className="border rounded px-2 py-1 text-sm bg-white"
    >
      {allOptions.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
      <option value="__add__">+ Tambah kategori...</option>
    </select>
  );
}
