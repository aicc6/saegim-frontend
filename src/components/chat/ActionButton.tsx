interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  text: string;
  icon?: React.ReactNode;
  className?: string;
}

export const ActionButton = ({
  onClick,
  disabled = false,
  text,
  icon,
  className = '',
}: ActionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium transition-colors ${
      disabled ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'
    } ${className}`}
  >
    {icon &&
      (typeof icon === 'string' ? (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      ) : (
        icon
      ))}
    {text}
  </button>
);
