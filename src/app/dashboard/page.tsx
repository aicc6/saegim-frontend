'use client';

const DashboardPage = () => {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        backgroundColor: 'var(--page-background)',
      }}
    >
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {/* 대시보드 컨텐츠 */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-4 font-serif">
                오늘의 감정
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                아직 오늘의 감정을 기록하지 않았어요.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-4 font-serif">
                최근 활동
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                아직 기록된 활동이 없어요.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
