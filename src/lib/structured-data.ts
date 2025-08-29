/**
 * 구조화된 데이터(JSON-LD) 생성 유틸리티
 */

export interface WebsiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: 'BusinessApplication' | 'LifestyleApplication';
  operatingSystem: string;
  creator: {
    '@type': 'Organization';
    name: string;
  };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface BlogPostSchema {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
}

// 기본 웹사이트 스키마
export const createWebsiteSchema = (): WebsiteSchema => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '새김',
  description:
    'AI와 함께하는 감성 다이어리로 일상을 기록하고 감정을 분석해보세요.',
  url: 'https://saegim.com',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  creator: {
    '@type': 'Organization',
    name: '새김팀',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
});

// 브레드크럼 스키마 생성
export const createBreadcrumbSchema = (
  items: Array<{
    name: string;
    url?: string;
  }>,
): BreadcrumbSchema => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    ...(item.url && { item: item.url }),
  })),
});

// FAQ 스키마 생성
export const createFAQSchema = (
  faqs: Array<{
    question: string;
    answer: string;
  }>,
): FAQSchema => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

// 블로그 포스트 스키마 생성
export const createBlogPostSchema = (post: {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
  url: string;
}): BlogPostSchema => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  author: {
    '@type': 'Person',
    name: post.author,
  },
  datePublished: post.publishedDate,
  dateModified: post.modifiedDate || post.publishedDate,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': post.url,
  },
});

// JSON-LD 스크립트 태그 생성
export const createJsonLdScript = (schema: Record<string, unknown>) => ({
  __html: JSON.stringify(schema),
});
