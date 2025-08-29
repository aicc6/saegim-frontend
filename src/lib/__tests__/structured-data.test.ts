import {
  createWebsiteSchema,
  createBreadcrumbSchema,
  createFAQSchema,
  createBlogPostSchema,
  createJsonLdScript,
} from '../structured-data';

describe('Structured Data Utils', () => {
  describe('createWebsiteSchema', () => {
    it('should create valid website schema', () => {
      const schema = createWebsiteSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebApplication');
      expect(schema.name).toBe('새김');
      expect(schema.description).toContain('감성 다이어리');
      expect(schema.url).toBe('https://saegim.com');
      expect(schema.applicationCategory).toBe('LifestyleApplication');
      expect(schema.creator.name).toBe('새김팀');
      expect(schema.offers?.price).toBe('0');
    });
  });

  describe('createBreadcrumbSchema', () => {
    it('should create breadcrumb schema with URLs', () => {
      const items = [
        { name: '홈', url: 'https://saegim.com' },
        { name: '다이어리', url: 'https://saegim.com/diary' },
        { name: '글쓰기' },
      ];

      const schema = createBreadcrumbSchema(items);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('홈');
      expect(schema.itemListElement[0].item).toBe('https://saegim.com');
      expect(schema.itemListElement[2].item).toBeUndefined();
    });

    it('should handle empty items array', () => {
      const schema = createBreadcrumbSchema([]);
      expect(schema.itemListElement).toHaveLength(0);
    });
  });

  describe('createFAQSchema', () => {
    it('should create FAQ schema', () => {
      const faqs = [
        {
          question: '새김은 어떤 서비스인가요?',
          answer: 'AI와 함께하는 감성 다이어리 서비스입니다.',
        },
        {
          question: '무료로 사용할 수 있나요?',
          answer: '네, 기본 기능은 무료로 제공됩니다.',
        },
      ];

      const schema = createFAQSchema(faqs);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]['@type']).toBe('Question');
      expect(schema.mainEntity[0].name).toBe('새김은 어떤 서비스인가요?');
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
      expect(schema.mainEntity[0].acceptedAnswer.text).toContain(
        'AI와 함께하는',
      );
    });

    it('should handle empty FAQ array', () => {
      const schema = createFAQSchema([]);
      expect(schema.mainEntity).toHaveLength(0);
    });
  });

  describe('createBlogPostSchema', () => {
    it('should create blog post schema', () => {
      const post = {
        title: '새김과 함께하는 감정 기록',
        description: '감정을 기록하는 방법에 대한 가이드',
        author: '새김팀',
        publishedDate: '2025-01-16',
        url: 'https://saegim.com/blog/emotional-recording',
      };

      const schema = createBlogPostSchema(post);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BlogPosting');
      expect(schema.headline).toBe(post.title);
      expect(schema.author.name).toBe('새김팀');
      expect(schema.datePublished).toBe('2025-01-16');
      expect(schema.dateModified).toBe('2025-01-16');
    });

    it('should use modifiedDate when provided', () => {
      const post = {
        title: 'Test Post',
        description: 'Test Description',
        author: 'Author',
        publishedDate: '2025-01-15',
        modifiedDate: '2025-01-16',
        url: 'https://test.com',
      };

      const schema = createBlogPostSchema(post);
      expect(schema.dateModified).toBe('2025-01-16');
    });
  });

  describe('createJsonLdScript', () => {
    it('should create script object with JSON string', () => {
      const schema = { test: 'data' };
      const result = createJsonLdScript(schema);

      expect(result.__html).toBe('{"test":"data"}');
    });

    it('should handle complex nested objects', () => {
      const schema = {
        '@context': 'https://schema.org',
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      const result = createJsonLdScript(schema);
      const parsed = JSON.parse(result.__html);
      expect(parsed).toEqual(schema);
    });
  });
});
