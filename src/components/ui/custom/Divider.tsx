interface DividerProps {
  text?: string;
  className?: string;
}

export default function Divider({
  text = '또는',
  className = '',
}: DividerProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border-subtle"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-background-primary text-text-secondary">
          {text}
        </span>
      </div>
    </div>
  );
}
