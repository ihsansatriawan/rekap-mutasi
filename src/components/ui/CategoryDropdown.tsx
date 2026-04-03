'use client';

import { useRef, useState } from 'react';
import { ALL_CATEGORIES } from '@/constants/categories';

interface CategoryDropdownProps {
  value: string;
  onChange: (category: string) => void;
  customCategories: string[];
  onAddCategory: (category: string) => void;
}

type ColorKey = 'green' | 'blue' | 'yellow' | 'red' | 'gray';

const CATEGORY_COLORS: Record<string, ColorKey> = {
  'Infaq/Donasi': 'green',
  'Operasional': 'yellow',
  'Konsumsi': 'blue',
  'Perbaikan/Maintenance': 'red',
  'Kegiatan': 'blue',
  'Transfer': 'gray',
  'Lainnya': 'gray',
};

const COLOR_STYLES: Record<ColorKey, React.CSSProperties> = {
  green: {
    background: 'hsla(151, 59%, 59%, 0.12)',
    color: 'hsl(151, 59%, 59%)',
    borderColor: 'rgba(95, 201, 146, 0.2)',
  },
  blue: {
    background: 'hsla(202, 100%, 67%, 0.15)',
    color: 'hsl(202, 100%, 67%)',
    borderColor: 'rgba(85, 179, 255, 0.2)',
  },
  yellow: {
    background: 'hsla(43, 100%, 60%, 0.12)',
    color: 'hsl(43, 100%, 60%)',
    borderColor: 'rgba(255, 188, 51, 0.2)',
  },
  red: {
    background: 'hsla(0, 100%, 69%, 0.15)',
    color: '#FF6363',
    borderColor: 'rgba(255, 99, 99, 0.2)',
  },
  gray: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-secondary)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
};

function getColor(category: string): ColorKey {
  return CATEGORY_COLORS[category] ?? 'gray';
}

export function CategoryDropdown({
  value,
  onChange,
  customCategories,
  onAddCategory,
}: CategoryDropdownProps) {
  const [editing, setEditing] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const selectRef = useRef<HTMLSelectElement>(null);

  const allOptions = [...ALL_CATEGORIES, ...customCategories];
  const colorStyle = COLOR_STYLES[getColor(value)];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__add__') {
      setAddingNew(true);
      setEditing(false);
    } else {
      onChange(val);
      setEditing(false);
    }
  };

  const handleAddConfirm = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !allOptions.includes(trimmed)) {
      onAddCategory(trimmed);
      onChange(trimmed);
    }
    setNewCategory('');
    setAddingNew(false);
  };

  if (addingNew) {
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          autoFocus
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddConfirm();
            if (e.key === 'Escape') { setAddingNew(false); setNewCategory(''); }
          }}
          placeholder="Nama kategori..."
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            outline: 'none',
            width: '120px',
            fontFamily: 'inherit',
            letterSpacing: '0.2px',
          }}
        />
        <button
          onClick={handleAddConfirm}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--blue)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            fontFamily: 'inherit',
            letterSpacing: '0.2px',
          }}
        >
          OK
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <select
        ref={selectRef}
        autoFocus
        value={value}
        onChange={handleSelectChange}
        onBlur={() => setEditing(false)}
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '6px',
          padding: '3px 8px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          letterSpacing: '0.2px',
        }}
      >
        {allOptions.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        <option value="__add__">+ Tambah kategori...</option>
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: 0,
        cursor: 'pointer',
        border: '1px solid',
        fontFamily: 'inherit',
        transition: 'opacity 0.15s',
        ...colorStyle,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
    >
      {value}
      <span style={{ opacity: 0.5, fontSize: '9px' }}>▾</span>
    </button>
  );
}
