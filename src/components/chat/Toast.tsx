interface ToastProps {
  show: boolean;
  message: string;
}

export const Toast = ({ show, message }: ToastProps) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
        {message}
      </div>
    </div>
  );
};
