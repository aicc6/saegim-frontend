'use client';

import DiaryListView from '@/app/(authenticated)/list/DiaryListView';
import PageHeader from '@/components/common/PageHeader';

export default function ListPage() {
  return (
    <div className="flex flex-col">
      {/* 페이지 헤더 */}
      <PageHeader
        title="글목록"
        subtitle="작성한 모든 일기를 한눈에 확인하세요"
      />

      <div className="flex flex-1">
        <main className="flex-1">
          <div className="container mx-auto px-6 py-8">
            {/* 기능 준비중 메시지
              <div className="bg-background-secondary rounded-2xl border border-border-subtle p-12 text-center">
                <div className="text-6xl mb-6">📋</div>
                <h2 className="text-h3 font-bold text-text-primary mb-4">
                  글목록 기능 준비중
                </h2>
                <p className="text-body text-text-secondary mb-6">
                  일기 목록 조회, 검색, 필터링 기능을 준비하고 있습니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="p-4 bg-background-primary rounded-lg border border-border-subtle">
                    <div className="text-2xl mb-2">🔍</div>
                    <h3 className="text-body font-medium text-text-primary mb-1">
                      검색 기능
                    </h3>
                    <p className="text-caption text-text-secondary">
                      제목, 내용, 키워드로 검색
                    </p>
                  </div>
                  <div className="p-4 bg-background-primary rounded-lg border border-border-subtle">
                    <div className="text-2xl mb-2">🏷️</div>
                    <h3 className="text-body font-medium text-text-primary mb-1">
                      필터링
                    </h3>
                    <p className="text-caption text-text-secondary">
                      감정별, 날짜별 필터
                    </p>
                  </div>
                  <div className="p-4 bg-background-primary rounded-lg border border-border-subtle">
                    <div className="text-2xl mb-2">📑</div>
                    <h3 className="text-body font-medium text-text-primary mb-1">
                      정렬 옵션
                    </h3>
                    <p className="text-caption text-text-secondary">
                      다양한 정렬 방식 제공
                    </p>
                  </div>
                </div>
              </div> */}

            {/* 글목록 컴포넌트 */}
            <DiaryListView />
          </div>
        </main>
      </div>
    </div>
  );
}
