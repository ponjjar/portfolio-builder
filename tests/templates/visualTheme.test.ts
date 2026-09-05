// @ts-nocheck
import { renderMinimalTemplate } from '@/templates/minimal';
import { PortfolioViewModel } from '@/templates/viewModel';

describe('Visual Theme Presets & Effects (Issue #34)', () => {
  const createBaseViewModel = (overrides: Partial<PortfolioViewModel> = {}): PortfolioViewModel => ({
    meta: {
      visible: true, title: 'Portfolio Test',
      description: 'Testing visual theme',
      generatedAt: '2026-08-31T00:00:00.000Z',
      version: '1.0.0',
    },
    profile: {
      name: 'Jane Doe',
      headline: 'Fullstack Developer',
      bio: 'Bio text',
      avatar: { type: 'url', value: 'https://example.com/avatar.png' },
    },
    projects: [],
    skills: [],
    theme: {
      mode: 'dark',
      accent: '#3b82f6',
    },
    settings: {
      showAvatar: true,
      showProjectImages: true,
      showGitHubLinks: true,
      showSkillCategories: true,
    },
    sections: [
      { id: 'hero', visible: true, title: 'Home', visible: true, order: 0 },
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
          bottomRight: 'technologies',
        },
      },
      skills: { placement: 'separate-section', grouping: 'none', collapsedRows: 5 },
      projects: {
        columns: 2,
        cardStyle: 'banner-card',
        carousel: {
          enabled: false,
          autoplay: true,
          intervalMs: 3000,
          paginationDots: true,
        },
      },
      career: { layout: "stacked", sharedEntryStyle: true, entryStyle: "timeline", experienceStyle: "timeline", educationStyle: "timeline", defaultTab: "experience" }, header: {
        enabled: false,
        showNavigation: true,
        showName: true,
        showAvatar: true,
        namePosition: 'left',
      },
    },
    animations: {
      enabled: false,
      intensity: 'subtle',
      sectionReveal: false,
      cardHover: true,
      chipStagger: true,
      backgroundParallax: false,
    },
    navigation: {
      enabled: false,
    },
    ...overrides,
  });

  describe('Theme Presets', () => {
    it('applies dark theme preset colors', () => {
      const vm = createBaseViewModel({
        visualTheme: {
          preset: 'dark',
          accent: '#3b82f6',
          backgroundEffects: {
            glows: { enabled: false, intensity: 'medium', color: '#3b82f6', count: 2 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        } as any
      });
      const html = renderMinimalTemplate(vm);

      expect(html).toContain('--bg: #0a0a0a;');
      expect(html).toContain('--text: #ffffff;');
    });

    it('applies amoled theme preset with pure black background', () => {
      const vm = createBaseViewModel({
        visualTheme: {
          preset: 'amoled',
          accent: '#8b5cf6',
          backgroundEffects: {
            glows: { enabled: false, intensity: 'medium', color: '#000000', count: 2 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        } as any
      });
      const html = renderMinimalTemplate(vm);

      expect(html).toContain('--bg: #000000;');
      expect(html).toContain('--surface: #111111;');
      expect(html).toContain('--border: #222222;');
    });

    it('applies lava theme preset with warm palette', () => {
      const vm = createBaseViewModel({
        visualTheme: {
          preset: 'lava',
          accent: '#ef4444',
          backgroundEffects: {
            glows: { enabled: false, intensity: 'medium', color: '#ef4444', count: 2 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        } as any
      });
      const html = renderMinimalTemplate(vm);

      expect(html).toContain('--bg: #1f0d0d;');
      expect(html).toContain('--surface: #2a1212;');
      expect(html).toContain('--border: #4a2020;');
    });

    it('applies cosmic-glow and soft-purple-glow with purple palette', () => {
      const vm = createBaseViewModel({
        visualTheme: {
          preset: 'cosmic-glow',
          accent: '#ec4899',
          backgroundEffects: {
            glows: { enabled: false, intensity: 'medium', color: '#ec4899', count: 2 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        },
      });
      const html = renderMinimalTemplate(vm);

      expect(html).toContain('--bg: #090514;');
      expect(html).toContain('--surface: #130a2a;');
      expect(html).toContain('--border: #2a1a5a;');
    });
  });

  describe('Accent Color', () => {
    it('applies custom accent color to CSS variables', () => {
      const customAccent = '#10b981';
      const vm = createBaseViewModel({
        visualTheme: {
          preset: 'dark',
          accent: customAccent,
          backgroundEffects: {
            glows: { enabled: false, intensity: 'medium', color: customAccent, count: 2 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        },
      });
      const html = renderMinimalTemplate(vm);

      expect(html).toContain(`--accent: ${customAccent};`);
    });
  });

  describe('Glow Effects', () => {
    it('renders glow blob elements and CSS when glows are enabled', () => {
      const vm = createBaseViewModel({
        visualTheme: {
          preset: 'dark',
          accent: '#3b82f6',
          backgroundEffects: {
            glows: { enabled: true, intensity: 'high', color: '#3b82f6', count: 3 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        } as any
      });
      const html = renderMinimalTemplate(vm);

      expect(html).toContain('class="glow-blob glow-1"');
      expect(html).toContain('class="glow-blob glow-2"');
      expect(html).toContain('filter: blur(150px);');
      expect(html).toContain('opacity: 0.4;');
    });

    it('adjusts blur and opacity according to intensity level', () => {
      const lowVm = createBaseViewModel({
        visualTheme: {
          preset: 'dark',
          accent: '#3b82f6',
          backgroundEffects: {
            glows: { enabled: true, intensity: 'low', color: '#3b82f6', count: 2 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        },
      });
      const lowHtml = renderMinimalTemplate(lowVm);
      expect(lowHtml).toContain('filter: blur(50px);');
      expect(lowHtml).toContain('opacity: 0.15;');

      const medVm = createBaseViewModel({
        visualTheme: {
          preset: 'dark',
          accent: '#3b82f6',
          backgroundEffects: {
            glows: { enabled: true, intensity: 'medium', color: '#3b82f6', count: 2 },
            microStars: { enabled: false, density: 'medium', opacity: 0.3 },
          },
        },
      });
      const medHtml = renderMinimalTemplate(medVm);
      expect(medHtml).toContain('filter: blur(100px);');
      expect(medHtml).toContain('opacity: 0.25;');
    });
  });

  describe('Micro Stars Background', () => {
    it('applies radial gradient background with specified density', () => {
      const vmHigh = createBaseViewModel({
        visualTheme: {
          preset: 'dark',
          accent: '#3b82f6',
          backgroundEffects: {
            glows: { enabled: false, intensity: 'medium', color: '#3b82f6', count: 2 },
            microStars: { enabled: true, density: 'high', opacity: 0.8 },
          },
        } as any
      });
      const htmlHigh = renderMinimalTemplate(vmHigh);
      expect(htmlHigh).toContain('background-image: radial-gradient(');
      expect(htmlHigh).toContain('background-size: 20px 20px;');

      const vmLow = createBaseViewModel({
        visualTheme: {
          preset: 'dark',
          accent: '#3b82f6',
          backgroundEffects: {
            glows: { enabled: false, intensity: 'medium', color: '#3b82f6', count: 2 },
            microStars: { enabled: true, density: 'low', opacity: 0.1 },
          },
        } as any
      });
      const htmlLow = renderMinimalTemplate(vmLow);
      expect(htmlLow).toContain('background-size: 50px 50px;');
    });
  });

  describe('Avatar Effects', () => {
    it('applies fade-in animation to avatar when effect is fade-in', () => {
      const vm = createBaseViewModel({
        layout: {
          ...createBaseViewModel().layout,
          profile: {
            ...createBaseViewModel().layout.profile,
            avatarStyle: { shape: 'circle', border: 'subtle', effect: 'fade-in' },
          },
        },
      });
      const html = renderMinimalTemplate(vm);
      expect(html).toContain('animation: fadeInAvatar 1s ease-out forwards;');
    });

    it('applies soft-shadow to avatar when effect is soft-shadow', () => {
      const vm = createBaseViewModel({
        layout: {
          ...createBaseViewModel().layout,
          profile: {
            ...createBaseViewModel().layout.profile,
            avatarStyle: { shape: 'circle', border: 'subtle', effect: 'soft-shadow' },
          },
        },
      });
      const html = renderMinimalTemplate(vm);
      expect(html).toContain('box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3)');
    });

    it('applies glow to avatar when effect is glow', () => {
      const vm = createBaseViewModel({
        layout: {
          ...createBaseViewModel().layout,
          profile: {
            ...createBaseViewModel().layout.profile,
            avatarStyle: { shape: 'circle', border: 'subtle', effect: 'glow' },
          },
        },
      });
      const html = renderMinimalTemplate(vm);
      expect(html).toContain('box-shadow: 0 0 30px -5px var(--accent);');
    });
  });
});
