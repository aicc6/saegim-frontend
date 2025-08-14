import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'bg-background-secondary border-t border-border-subtle',
        className,
      )}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-body-small text-text-secondary">
            © 2025 새김. All rights reserved.
          </p>
          <p className="text-caption text-text-placeholder mt-1">
            AI와 함께 쓰는 감성 다이어리
          </p>
        </div>
      </div>
    </footer>
  );
}
