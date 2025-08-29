export const LoadingMessage = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-3 animate-pulse">
        {[40, 100, 90, 80].map((width, idx) => (
          <div
            key={idx}
            className={`h-4 rounded bg-gray-200 ${
              width === 40
                ? 'w-2/5'
                : width === 100
                  ? 'w-full'
                  : width === 90
                    ? 'w-11/12'
                    : 'w-5/6'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
