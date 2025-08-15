'use client';
import { Save } from 'lucide-react';
import { Button } from '../ui/button';

export default function AutheticatedHeader() {
  const handleSave = () => {
    // 다이어리 저장 로직
    console.log('다이어리 저장:');
  };

  return (
    <div className="bg-white border-b border-sage-20 p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-sage-100">글쓰기</h1>
        </div>

        <Button
          onClick={handleSave}
          className="bg-sage-50 hover:bg-sage-60 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          저장하기
        </Button>
      </div>
    </div>
  );
}
