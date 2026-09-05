// @ts-nocheck
import { escapeHtml } from '@/utils/htmlSecurity';
import { renderMinimalTemplate } from '@/templates/minimal';
import { PortfolioViewModel } from '@/templates/viewModel';

describe('HTML Escaping & Security in Template (Issue #29)', () => {
  describe('escapeHtml utility function', () => {
    it('should escape HTML special characters correctly', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml("it's dangerous")).toBe('it&#039;s dangerous');
    });

    it('should handle null and undefined safely', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });

    it('should preserve unicode, accents, and emojis', () => {
      const accented = 'Olá, mundo! Acentuação: áéíóú, ãõ, ç';
      expect(escapeHtml(accented)).toBe(accented);

      const emoji = 'Desenvolvedor Fullstack 🚀✨💻';
      expect(escapeHtml(emoji)).toBe(emoji);
    });
  });

  describe('Template injection prevention on renderMinimalTemplate', () => {
    const createBaseViewModel = (overrides: Partial<PortfolioViewModel> = {}): PortfolioViewModel => ({
      meta: {
        title: 'Portfolio Test',
        description: 'Testing security',
        generatedAt: '2026-08-31T00:00:00.000Z',
        version: '1.0.0'
      },
      profile: {
        name: 'John Doe',
        headline: 'Software Engineer',
        bio: 'Hello world',
        avatar: { type: 'url', value: 'https://example.com/avatar.png' }
      },
      projects: [],
      skills: [],
      theme: {
        mode: 'dark',
        accent: '#3b82f6'
      },
      settings: {
        showAvatar: true,
        showProjectImages: true,
        showGitHubLinks: true,
        showSkillCategories: true
      },
      sections: [
        { id: 'hero', title: 'Home', visible: true, order: 0 },
        { id: 'projects', title: 'Projects', visible: true, order: 1 },
        { id: 'skills', title: 'Skills', visible: true, order: 2 }
      ],
      socialLinks: [],
      layout: {
        profile: {
          variant: 'stacked-center',
          cornerItemsOrder: ['name', 'links', 'headline'],
          embedsTechnologies: false,
          avatarStyle: { shape: 'circle', border: 'subtle', effect: 'none' },
          zones: {
            center: 'avatar',
            topLeft: 'name',
            topRight: 'headline',
            left: 'links',
            right: '',
            topCenter: '',
            bottomLeft: 'description',
            bottomRight: 'technologies'
          }
        },
        projects: {
          columns: 2,
          cardStyle: 'banner-card',
          carousel: {
            enabled: false,
            autoplay: true,
            intervalMs: 3000,
            paginationDots: true
          }
        },
        header: {
          enabled: false,
          showNavigation: true,
          showName: true,
          showAvatar: true,
          namePosition: 'left'
        }
      },
      animations: {
        revealOnScroll: false
      },
      navigation: {
        enabled: false,
        items: []
      },
      ...overrides
    });

    it('should escape malicious script tags in profile name', () => {
      const vm = createBaseViewModel({
        profile: {
          name: '<script>alert("XSS")</script>',
          headline: 'Hacker',
          bio: 'Bio',
          avatar: undefined
        }
      });
      const html = renderMinimalTemplate(vm);

      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should escape onclick and other handlers in profile headline and bio', () => {
      const vm = createBaseViewModel({
        profile: {
          name: 'Jane Doe',
          headline: '" onclick="alert(\'headline\')" data-bad="',
          bio: '<img src="invalid" onerror="alert(\'bio\')" />',
          avatar: undefined
        }
      });
      const html = renderMinimalTemplate(vm);

      expect(html).not.toContain('onclick="alert');
      expect(html).not.toContain('onerror="alert');
      expect(html).toContain('&quot; onclick=&quot;alert(&#039;headline&#039;)&quot;');
      expect(html).toContain('&lt;img src=&quot;invalid&quot; onerror=&quot;alert(&#039;bio&#039;)&quot; /&gt;');
    });

    it('should escape malicious HTML and attributes in project fields and URLs', () => {
      const vm = createBaseViewModel({
        projects: [
          {
            id: 'p1',
            title: '<b onmouseover="alert(\'title\')">Exploit</b>',
            description: '<style>body{display:none}</style>',
            shortDescription: '<script>eval("malicious")</script>',
            technologies: ['<svg/onload=alert(1)>', 'React'],
            links: {
              demo: 'https://example.com/?q="><script>alert(1)</script>',
              repository: 'https://github.com/test"><script>alert(2)</script>'
            },
            featured: true
          } as any
        ]
      });
      const html = renderMinimalTemplate(vm);

      expect(html).not.toContain('<b onmouseover="alert(\'title\')">Exploit</b>');
      expect(html).not.toContain('<style>body{display:none}</style>');
      expect(html).not.toContain('<script>eval("malicious")</script>');
      expect(html).not.toContain('<svg/onload=alert(1)>');
      expect(html).toContain('&lt;b onmouseover=&quot;alert(&#039;title&#039;)&quot;&gt;Exploit&lt;/b&gt;');
      expect(html).toContain('&lt;script&gt;eval(&quot;malicious&quot;)&lt;/script&gt;');
      expect(html).toContain('&lt;svg/onload=alert(1)&gt;');
      expect(html).toContain('href="https://example.com/?q=&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
    });

    it('should escape malicious social links labels and urls', () => {
      const vm = createBaseViewModel({
        socialLinks: [
          {
            label: '<span onclick="evil()">Twitter</span>',
            url: 'https://twitter.com/test" onfocus="evil()'
          } as any
        ]
      });
      const html = renderMinimalTemplate(vm);

      expect(html).not.toContain('<span onclick="evil()">Twitter</span>');
      expect(html).toContain('&lt;span onclick=&quot;evil()&quot;&gt;Twitter&lt;/span&gt;');
      expect(html).toContain('href="https://twitter.com/test&quot; onfocus=&quot;evil()"');
    });

    it('should escape skills and category names', () => {
      const vm = createBaseViewModel({
        skills: [
          { name: '<img src=x onerror=alert(1)>', category: '<script>alert("cat")</script>' as any }
        ]
      });
      const html = renderMinimalTemplate(vm);

      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).not.toContain('<script>alert("cat")</script>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('&lt;script&gt;alert(&quot;cat&quot;)&lt;/script&gt;');
    });
  });
});
