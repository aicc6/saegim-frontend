'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TimePickerProps {
  value?: string; // HH:mm
  onChange: (value: string) => void;
  onConfirm?: () => void;
  className?: string;
  dark?: boolean;
}

function formatKoreanTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const suffix = h < 12 ? '오전' : '오후';
  const hour12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, '0');
  return `${suffix} ${hour12}:${mm}`;
}

export const TimePicker = ({
  value,
  onChange,
  onConfirm: _onConfirm,
  className,
  dark,
}: TimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internal, setInternal] = useState<string>(value || '11:00');
  const ref = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value) setInternal(value);
  }, [value]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  const items = useMemo(() => {
    const arr: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30)
        arr.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return arr;
  }, []);

  const baseBtn = `px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
    dark
      ? 'bg-[#1f2937] text-white border-sage-40 focus:ring-sage-40'
      : 'bg-white text-sage-90 border-sage-30 focus:ring-sage-50'
  }`;

  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number | 'fit-content';
    maxH: number;
  } | null>(null);

  const calcPos = () => {
    const el = ref.current;
    if (!el) return;
    const btn = el.querySelector('button');
    if (!btn) return;
    const rect = (btn as HTMLButtonElement).getBoundingClientRect();
    const gap = 6;
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const desired = 240;
    const maxHBelow = Math.min(desired, spaceBelow);
    const maxHAbove = Math.min(desired, spaceAbove);
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow; // 화면 하단에 가까우면 위로
    const maxH = Math.max(120, openUp ? maxHAbove : maxHBelow);
    const top = openUp
      ? rect.top - maxH - gap // 위로 펼침: 높이만큼 위로 올림
      : rect.bottom + gap; // 아래로 펼침
    const width: number | 'fit-content' = 'fit-content';
    setMenuPos({ top, left: rect.left, width, maxH });
  };

  useEffect(() => {
    if (!isOpen) return;
    calcPos();
    const handler = () => calcPos();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className || ''}`} ref={ref}>
      <button
        type="button"
        className={baseBtn}
        onClick={() => setIsOpen((v) => !v)}
      >
        {formatKoreanTime(internal)}
      </button>
      {isOpen &&
        menuPos &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
            className="z-[1000]"
            ref={menuRef}
          >
            <div
              className={`w-full overflow-auto rounded-md border shadow-md text-sm ${
                dark
                  ? 'bg-[#1f2937] text-white border-sage-40'
                  : 'bg-white text-sage-90 border-sage-30'
              }`}
              style={{ maxHeight: menuPos.maxH }}
            >
              <ul className="py-1 pl-1 pr-0.5">
                {items.map((t) => {
                  const [hStr, mStr] = t.split(':');
                  const h = parseInt(hStr, 10);
                  const suffix = h < 12 ? '오전' : '오후';
                  const hour12 = ((h + 11) % 12) + 1;
                  const label = `${hour12}:${mStr.padStart(2, '0')}`;
                  const isActive = t === internal;
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        className={`w-full flex items-center justify-start gap-2 pl-3 pr-2 py-2 rounded-md whitespace-nowrap ${
                          isActive
                            ? dark
                              ? 'bg-sage-40 text-white'
                              : 'bg-sage-20'
                            : dark
                              ? 'hover:bg-[#374151]'
                              : 'hover:bg-sage-10'
                        }`}
                        onClick={() => {
                          setInternal(t);
                          onChange(t);
                          setIsOpen(false);
                        }}
                      >
                        <span>{suffix}</span>
                        <span className="font-medium tabular-nums">
                          {label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default TimePicker;
