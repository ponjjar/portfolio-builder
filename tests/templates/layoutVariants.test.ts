// @ts-nocheck
import { renderMinimalTemplate } from '@/templates/minimal';
import { PortfolioViewModel } from '@/templates/viewModel';

describe('Layout Variants HTML Generation (Issue #35)', () => {
  const createBaseViewModel = (overrides: Partial<PortfolioViewModel> = {}): PortfolioViewModel => ({
    meta: {
      visible: true, title: 'Portfolio Test',
      description: 'Testing layout variants',
      generatedAt: '2026-08-31T00:00:00.000Z',
      version: '1.0.0',
    },
    profile: {
      name: 'John Developer',
      headline: 'Software Architect',
      bio: 'Writing code and building systems.',
      avatar: { type: 'url', value: 'https://example.com/john.png' },
    },
    projects: [],
    skills: [
      { name: 'TypeScript', category: 'Frontend' },
      { name: 'Node.js', category: 'Backend' },
    ],
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
    socialLinks: [ { type: "github", label: "GitHub", url: "https://github.com" },
      
      
    ],
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
    sections: [
      { id: 'hero', visible: true, order: 0 } as any,
    ],
  });

  it('renders stacked-center layout correctly with hero-stacked-center class', () => {
    const vm = createBaseViewModel({
      layout: {
        ...createBaseViewModel().layout,
        profile: {
          ...createBaseViewModel().layout.profile,
          variant: 'stacked-center',
        },
      },
    });

    const html = renderMinimalTemplate(vm);

    expect(html).toContain('class="hero hero-stacked-center"');
    expect(html).toContain('class="avatar orbit-avatar"');
    expect(html).toContain('<h1>John Developer</h1>');
    expect(html).toContain('<p class="hero-headline">Software Architect</p>');
    expect(html).toContain('<p class="hero-bio">Writing code and building systems.</p>');
    expect(html).toContain('class="social-links"');
  });

  it('renders avatar-side layout with hero-avatar-side class', () => {
    const vm = createBaseViewModel({
      layout: {
        ...createBaseViewModel().layout,
        profile: {
          ...createBaseViewModel().layout.profile,
          variant: 'avatar-side',
        },
      },
    });

    const html = renderMinimalTemplate(vm);

    expect(html).toContain('class="hero hero-avatar-side"');
    expect(html).toContain('class="avatar orbit-avatar"');
    expect(html).toContain('<h1>John Developer</h1>');
    expect(html).toContain('Software Architect');
  });

  it('renders center-orbit layout with hero-center-orbit class and corner items', () => {
    const vm = createBaseViewModel({
      layout: {
        ...createBaseViewModel().layout,
        profile: {
          ...createBaseViewModel().layout.profile,
          variant: 'center-orbit',
          cornerItemsOrder: ['name', 'links', 'headline'],
        },
      },
    });

    const html = renderMinimalTemplate(vm);

    expect(html).toContain('class="hero-center-orbit"');
    expect(html).toContain('class="orbit-item-0"');
    expect(html).toContain('class="orbit-item-1"');
    expect(html).toContain('class="orbit-item-2"');
    expect(html).toContain('<h1>John Developer</h1>');
  });

  it('renders custom-orbit-builder layout with hero-custom-orbit class and configured zone grid areas', () => {
    const vm = createBaseViewModel({
      layout: {
        ...createBaseViewModel().layout,
        profile: {
          ...createBaseViewModel().layout.profile,
          variant: 'custom-orbit-builder',
          embedsTechnologies: true,
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
      },
    });

    const html = renderMinimalTemplate(vm);

    expect(html).toContain('class="hero-custom-orbit"');
    expect(html).toContain('style="grid-area: topleft"');
    expect(html).toContain('style="grid-area: topright"');
    expect(html).toContain('style="grid-area: left"');
    expect(html).toContain('style="grid-area: bottomleft"');
    expect(html).toContain('style="grid-area: bottomright"');
    expect(html).toContain('TypeScript');
    expect(html).toContain('Node.js');
  });
});
