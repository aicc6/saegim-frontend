'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    data-slot="switch"
    className={cn(
      // 기본 레이아웃과 크기
      'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 shadow-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',

      // 체크된 상태 (활성화) - 명확한 초록색
      'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 hover:data-[state=checked]:bg-green-600',
      'dark:data-[state=checked]:bg-green-600 dark:data-[state=checked]:border-green-600 dark:hover:data-[state=checked]:bg-green-700',

      // 체크되지 않은 상태 (비활성화) - 명확한 회색
      'data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:border-gray-300 hover:data-[state=unchecked]:bg-gray-300',
      'dark:data-[state=unchecked]:bg-gray-700 dark:data-[state=unchecked]:border-gray-600 dark:hover:data-[state=unchecked]:bg-gray-600',

      // 포커스 링 스타일
      'focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',

      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        // 기본 썸 스타일
        'pointer-events-none block h-5 w-5 rounded-full ring-0 transition-transform duration-200 ease-in-out',

        // 항상 흰색 배경으로 명확한 대비
        'bg-white shadow-md',
        'dark:bg-white',

        // 위치 이동 애니메이션
        'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',

        // 호버시 약간의 그림자 효과
        'group-hover:shadow-lg',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
