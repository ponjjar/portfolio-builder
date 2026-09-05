import { PortfolioViewModel } from '../viewModel';
import { escapeHtml } from '@/utils/htmlSecurity';
import { resolveProfileBio, resolveProjectTranslation } from '@/utils/localization';
import ptBR from '@/i18n/locales/pt-BR.json';
import enUS from '@/i18n/locales/en.json';

const translations: Record<string, any> = {
  'pt-BR': ptBR.translation,
  'en': enUS.translation
};

export function renderMinimalTemplate(viewModel: PortfolioViewModel): string {
  const { profile, projects, skills, experiences, education, theme, visualTheme, settings, sections, socialLinks, layout, animations, navigation, languageSettings } = viewModel;

  const currentVisualTheme = visualTheme || { preset: 'dark', accent: theme.accent || '#3b82f6', backgroundEffects: { glows: { enabled: false, intensity: 'medium', color: '#3b82f6', count: 2 }, microStars: { enabled: false, density: 'low', opacity: 0.3 } } };
  const accentColor = currentVisualTheme.accent;
  const isDark = currentVisualTheme.preset !== 'clean-light' && currentVisualTheme.preset !== 'minimal';
  
  // Base Translation
  const t = (keyPath: string) => {
    const keys = keyPath.split('.');
    let val = translations[languageSettings.defaultLanguage];
    if (!val) val = translations['en']; // fallback
    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = val[k];
      } else {
        return keyPath;
      }
    }
    return val as string;
  };

  const renderI18n = (keyPath: string) => {
    if (languageSettings.supportedLanguages.length <= 1) {
      return escapeHtml(t(keyPath));
    }
    return languageSettings.supportedLanguages.map(lang => {
      const keys = keyPath.split('.');
      let val = translations[lang] || translations['en'];
      for (const k of keys) {
        if (val && typeof val === 'object') val = val[k];
        else { val = keyPath; break; }
      }
      return `<span class="i18n-lang" data-lang="${lang}">${escapeHtml(val as string)}</span>`;
    }).join('');
  };

  
  // Theme Presets Base Colors
  let bgColor = isDark ? '#0a0a0a' : '#ffffff';
  let textColor = isDark ? '#ffffff' : '#111827';
  let mutedColor = isDark ? '#a1a1aa' : '#6b7280';
  let surfaceColor = isDark ? '#171717' : '#f3f4f6';
  let borderColor = isDark ? '#262626' : '#e5e7eb';

  if (currentVisualTheme.preset === 'amoled') {
    bgColor = '#000000';
    surfaceColor = '#111111';
    borderColor = '#222222';
  } else if (currentVisualTheme.preset === 'lava') {
    bgColor = '#1f0d0d';
    surfaceColor = '#2a1212';
    borderColor = '#4a2020';
  } else if (currentVisualTheme.preset === 'cosmic-glow' || currentVisualTheme.preset === 'soft-purple-glow') {
    bgColor = '#090514';
    surfaceColor = '#130a2a';
    borderColor = '#2a1a5a';
  }

  // Sort sections
  const visibleSections = sections.filter(s => s.visible).sort((a, b) => a.order - b.order);

  // Layout settings
  const pLayout = layout?.profile || { variant: 'stacked-center', cornerItemsOrder: ['name', 'links', 'headline'], embedsTechnologies: false, avatarStyle: { shape: 'circle', border: 'subtle', effect: 'none' }, zones: { center: 'avatar', topLeft: 'name', topRight: 'headline', left: 'links', right: '', topCenter: '', bottomLeft: 'description', bottomRight: 'technologies' } };
  const prLayout = layout?.projects || { columns: 2, cardStyle: 'banner-card', carousel: { enabled: false, autoplay: true, intervalMs: 3000, paginationDots: true } };
  const hLayout = layout?.header || { enabled: false, showNavigation: true, showName: true, showAvatar: true, namePosition: 'left' };
  const cLayout = layout?.career || { enabled: true, layout: 'stacked', sharedEntryStyle: true, entryStyle: 'timeline', experienceStyle: 'timeline', educationStyle: 'timeline', defaultTab: 'experience' };

  // Micro Stars CSS
  let starsCSS = '';
  if (currentVisualTheme.backgroundEffects.microStars.enabled) {
    const d = currentVisualTheme.backgroundEffects.microStars.density;
    const bgSize = d === 'high' ? '20px 20px' : d === 'medium' ? '30px 30px' : '50px 50px';
    const dotColor = isDark ? `rgba(255, 255, 255, ${currentVisualTheme.backgroundEffects.microStars.opacity})` : `rgba(0, 0, 0, ${currentVisualTheme.backgroundEffects.microStars.opacity})`;
    starsCSS = `
      body {
        background-image: radial-gradient(${dotColor} 1px, transparent 1px);
        background-size: ${bgSize};
      }
    `;
  }

  // Glows CSS
  let glowsCSS = '';
  let glowsHTML = '';
  if (currentVisualTheme.backgroundEffects.glows.enabled) {
    const intensity = currentVisualTheme.backgroundEffects.glows.intensity;
    const blur = intensity === 'high' ? '150px' : intensity === 'medium' ? '100px' : '50px';
    const opacity = intensity === 'high' ? '0.4' : intensity === 'medium' ? '0.25' : '0.15';
    
    glowsCSS = `
      @keyframes rotateBlob {
        0% { transform: rotate(0deg) translate(0px, 0px) scale(1); }
        33% { transform: rotate(120deg) translate(30px, -30px) scale(1.1); }
        66% { transform: rotate(240deg) translate(-30px, 30px) scale(0.9); }
        100% { transform: rotate(360deg) translate(0px, 0px) scale(1); }
      }
      .glow-blob {
        position: fixed;
        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
        filter: blur(${blur});
        opacity: ${opacity};
        z-index: -1;
        pointer-events: none;
      }
      .glow-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: ${currentVisualTheme.backgroundEffects.glows.color}; animation: rotateBlob 40s linear infinite; }
      .glow-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: var(--accent); animation: rotateBlob 60s linear infinite reverse; }
    `;
    glowsHTML = `<div class="glow-blob glow-1"></div><div class="glow-blob glow-2"></div>`;
  }

  // Avatar Style CSS
  const ast = pLayout.avatarStyle;
  const avatarRadius = ast?.shape === 'square' ? '0' : ast?.shape === 'rounded-square' ? '16px' : '50%';
  const avatarBorder = ast?.border === 'none' ? 'none' : ast?.border === 'strong' ? '4px solid var(--border)' : '2px solid var(--border)';
  
  let avatarEffectCSS = '';
  if (ast?.effect === 'fade-in') {
    avatarEffectCSS = 'animation: fadeInAvatar 1s ease-out forwards; opacity: 0;';
  } else if (ast?.effect === 'soft-shadow') {
    avatarEffectCSS = 'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1);';
  } else if (ast?.effect === 'glow') {
    avatarEffectCSS = 'box-shadow: 0 0 30px -5px var(--accent);';
  }

  // Generate CSS
  const css = `
    :root {
      --bg: ${bgColor};
      --text: ${textColor};
      --muted: ${mutedColor};
      --surface: ${surfaceColor};
      --border: ${borderColor};
      --accent: ${accentColor};
      --font-sans: system-ui, -apple-system, sans-serif;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font-sans);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
    }
    a { color: var(--text); text-decoration: none; transition: color 0.2s; }
    a:hover { color: var(--accent); }

    ${starsCSS}
    ${glowsCSS}

    @keyframes fadeInAvatar { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

    /* Header */
    header.site-header {
      position: sticky;
      top: 0;
      background: rgba(${isDark ? '23,23,23' : '243,244,246'}, 0.85);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      padding: 1rem 1.5rem;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    header.site-header .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.1rem;
    }
    header.site-header .brand img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
    header.site-header nav { display: flex; gap: 1.5rem; }
    header.site-header nav a { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
    @media (max-width: 600px) { header.site-header { flex-direction: column; gap: 1rem; padding: 1rem; } }

    .container { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }

    section { margin-bottom: 5rem; ${(animations as any)?.sectionReveal ? `opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out;` : ''} }
    ${(animations as any)?.sectionReveal ? `
    section.visible { opacity: 1; transform: translateY(0); }
    @media (prefers-reduced-motion: reduce) { section { opacity: 1; transform: none; transition: none; } }
    ` : ''}

    h1, h2, h3 { font-weight: 700; line-height: 1.2; }
    h2 { font-size: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .muted { color: var(--muted); }

    /* Hero */
    .hero { padding: 4rem 0; margin-bottom: 4rem; }
    .hero-stacked-center { text-align: center; display: flex; flex-direction: column; align-items: center; }
    .hero-avatar-side { display: flex; flex-direction: row; align-items: center; gap: 3rem; }
    @media (max-width: 600px) { .hero-avatar-side { flex-direction: column; text-align: center; } }
    
    .hero-center-orbit {
      display: grid;
      grid-template-areas: "topleft topright" "center center" "bottomleft bottomright";
      gap: 2rem; align-items: center; justify-items: center; text-align: center; position: relative;
    }
    .hero-center-orbit > .orbit-avatar { grid-area: center; }
    .hero-center-orbit > .orbit-item-0 { grid-area: topleft; justify-self: end; }
    .hero-center-orbit > .orbit-item-1 { grid-area: topright; justify-self: start; }
    .hero-center-orbit > .orbit-item-2 { grid-area: bottomleft; grid-column: span 2; margin-top: 1rem; }
    
    .hero-custom-orbit {
      display: grid;
      grid-template-areas: 
        "topleft topcenter topright"
        "left center right"
        "bottomleft bottomcenter bottomright";
      gap: 1.5rem;
      align-items: center; justify-items: center; text-align: center;
    }
    @media (max-width: 768px) {
      .hero-center-orbit, .hero-custom-orbit {
        display: flex; flex-direction: column;
      }
    }

    .avatar { 
      width: 140px; height: 140px; 
      border-radius: ${avatarRadius}; 
      object-fit: cover; 
      margin-bottom: 1.5rem; 
      border: ${avatarBorder};
      ${avatarEffectCSS}
    }
    .hero-avatar-side .avatar { margin-bottom: 0; width: 180px; height: 180px; }
    .hero-center-orbit .avatar, .hero-custom-orbit .avatar { width: 200px; height: 200px; margin-bottom: 0; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .hero-headline { font-size: 1.25rem; color: var(--muted); max-width: 600px; margin: 0.5rem auto; }
    .hero-bio { margin-top: 1.5rem; max-width: 700px; text-align: left;}
    
    .social-links { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1.5rem; }
    .hero-stacked-center .social-links, .hero-center-orbit .social-links, .hero-custom-orbit .social-links { justify-content: center; }
    .btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 500; font-size: 0.875rem; border: 1px solid var(--border); background: var(--surface); }
    .btn:hover { border-color: var(--accent); }
    .tech-badge { font-size: 0.75rem; padding: 0.25rem 0.75rem; background: var(--surface); border: 1px solid var(--border); border-radius: 9999px; color: var(--muted); display: inline-block; margin: 0.25rem; }

    /* Projects */
    .projects-grid {
      display: grid; gap: 2rem;
      grid-template-columns: repeat(${prLayout.columns}, 1fr);
    }
    @media (max-width: 768px) { .projects-grid { grid-template-columns: 1fr; } }

    .carousel-wrapper { position: relative; }
    .projects-carousel {
      display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 1.5rem; padding-bottom: 1rem;
      scrollbar-width: none; -ms-overflow-style: none; scroll-behavior: smooth;
    }
    .projects-carousel::-webkit-scrollbar { display: none; }
    .projects-carousel > * { scroll-snap-align: center; flex: 0 0 calc(100% / ${Math.min(3, prLayout.columns)} - 1rem); }
    @media (max-width: 768px) { .projects-carousel > * { flex: 0 0 85%; } }
    
    .carousel-arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--surface); border: 1px solid var(--border);
      color: var(--text); font-size: 1.2rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 10; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .carousel-arrow:hover { color: var(--accent); border-color: var(--accent); }
    .carousel-arrow-prev { left: -20px; }
    .carousel-arrow-next { right: -20px; }
    @media (max-width: 768px) { .carousel-arrow { display: none; } }

    .carousel-pagination { display: flex; justify-content: center; gap: 8px; margin-top: 1rem; }
    .carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); cursor: pointer; border: none; padding: 0; }
    .carousel-dot.active { background: var(--accent); }

    /* Career Section */
    .career-grid { display: grid; gap: 2rem; }
    .career-side-by-side { grid-template-columns: 1fr 1fr; }
    @media (max-width: 768px) { .career-side-by-side { grid-template-columns: 1fr; } }
    .career-tabs-header { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); }
    .career-tab-btn { background: none; border: none; color: var(--muted); padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; transition: all 0.3s ease; }
    .career-tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }
    .career-tab-content { display: none; opacity: 0; transition: opacity 0.3s ease; }
    .career-tab-content.active { display: block; opacity: 1; }

    /* Entry Styles */
    .entry-list { display: flex; flex-direction: column; gap: 1.5rem; }
    
    .style-timeline { border-left: 2px solid var(--border); padding-left: 1.5rem; position: relative; margin-left: 0.5rem; }
    .style-timeline .entry-item { position: relative; margin-bottom: 2rem; }
    .style-timeline .entry-item:last-child { margin-bottom: 0; }
    .style-timeline .entry-item::before { content: ''; position: absolute; left: -1.85rem; top: 0.25rem; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg); }
    
    .style-cards .entry-item { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; transition: transform 0.3s, border-color 0.3s; }
    ${(animations as any)?.cardHover ? '.style-cards .entry-item:hover { transform: translateY(-4px); border-color: var(--accent); }' : ''}
    
    .style-stepper { display: flex; flex-direction: column; gap: 2rem; }
    .style-stepper .entry-item { display: flex; gap: 1rem; }
    .style-stepper .step-number { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: var(--surface); border: 1px solid var(--accent); color: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; }
    .style-stepper .step-content { flex: 1; padding-top: 0.25rem; }
    
    .style-list .entry-item { border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; }
    .style-list .entry-item:last-child { border-bottom: none; padding-bottom: 0; }

    .entry-date { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.25rem; display: block; font-weight: 500; }
    .entry-title { font-size: 1.1rem; font-weight: 600; color: var(--text); margin-bottom: 0.25rem; }
    .entry-subtitle { font-size: 0.95rem; color: var(--muted); margin-bottom: 0.75rem; font-weight: 500; }
    .entry-desc { font-size: 0.95rem; color: var(--text); line-height: 1.6; white-space: pre-line; }

    .project-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .project-card.logo-side-card { flex-direction: row; align-items: stretch; }
    @media (max-width: 600px) { .project-card.logo-side-card { flex-direction: column; } }
    .project-image { width: 100%; height: 200px; object-fit: cover; border-bottom: 1px solid var(--border); }
    .project-card.logo-side-card .project-image { width: 140px; height: 100%; min-height: 200px; border-bottom: none; border-right: 1px solid var(--border); }
    @media (max-width: 600px) { .project-card.logo-side-card .project-image { width: 100%; height: 160px; border-right: none; border-bottom: 1px solid var(--border); } }
    .project-content { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .project-title { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .project-desc { color: var(--muted); margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .project-tech { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .project-links { display: flex; gap: 1rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border); align-items: center; }
    .project-link { font-size: 0.875rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; }
    
    ${(animations as any)?.cardHover ? `
    .project-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .project-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.2); }
    ` : ''}

    .skills-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 2rem; }
    .skill-category h3 { font-size: 1.1rem; margin-bottom: 1rem; color: var(--accent); }
    .skill-list { list-style: none; }
    .skill-list li { padding: 0.5rem 0; border-bottom: 1px solid var(--border); color: var(--text); }
    .skill-list li:last-child { border-bottom: none; }
    
    ${(animations as any)?.chipStagger ? `
    .tech-badge { transition: transform 0.2s ease, background 0.2s ease; }
    .tech-badge:hover { transform: scale(1.05); background: var(--border); }
    ` : ''}

    .beside-profile-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 3rem;
      align-items: start;
    }
    .beside-profile-layout > #hero { grid-column: 1; }
    .beside-profile-layout > #skills { grid-column: 2; margin-top: 0; }
    .beside-profile-layout > #projects { grid-column: 1 / -1; margin-top: 3rem; }
    @media (max-width: 900px) {
      .beside-profile-layout { display: flex; flex-direction: column; gap: 0; }
      .beside-profile-layout > #projects { margin-top: 0; }
    }

    footer { text-align: center; padding: 2rem 0; color: var(--muted); border-top: 1px solid var(--border); margin-top: 4rem; font-size: 0.875rem; }
  `;

  // Build localized text blocks
  const renderLocalizedBio = () => {
    if (languageSettings.supportedLanguages.length === 0) return profile.bio ? `<p class="hero-bio">${escapeHtml(profile.bio)}</p>` : '';
    return `<p class="hero-bio">` + languageSettings.supportedLanguages.map(lang => {
      const { bio } = resolveProfileBio(profile, lang, languageSettings);
      return bio ? `<span class="i18n-lang" data-lang="${lang}">${escapeHtml(bio)}</span>` : '';
    }).join('') + `</p>`;
  };

  const avatarHtml = settings.showAvatar && profile.avatar ? `<img class="avatar orbit-avatar" src="${escapeHtml(profile.avatar.value)}" alt="${escapeHtml(profile.name)}" />` : '';
  const nameHtml = `<h1>${escapeHtml(profile.name)}</h1>`;
  const headlineHtml = `<p class="hero-headline">${escapeHtml(profile.headline)}</p>`;
  const linksHtml = `
    <div class="social-links">
      ${socialLinks.map(link => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="btn">${escapeHtml(link.label)}</a>`).join('')}
    </div>
  `;
  const bioHtml = renderLocalizedBio();
  
  // Render Technologies for embedded profile usage
  let techHtml = '';
  if (pLayout.embedsTechnologies && (pLayout.variant === 'custom-orbit-builder' || pLayout.variant === 'center-orbit')) {
    const allSkills = skills.map(s => escapeHtml(s.name));
    techHtml = `<div>${allSkills.map(s => `<span class="tech-badge">${s}</span>`).join('')}</div>`;
  }

  // --- Render Header ---
  const renderHeader = () => {
    if (!hLayout.enabled) return '';
    let brandHtml = '';
    const avatarImg = (hLayout.showAvatar && profile.avatar) ? `<img src="${escapeHtml(profile.avatar.value)}" alt="" />` : '';
    const nameText = hLayout.showName ? `<span>${escapeHtml(profile.name)}</span>` : '';
    
    if (hLayout.namePosition === 'right') { brandHtml = `${avatarImg}${nameText}`; } else { brandHtml = `${nameText}${avatarImg}`; }

    // Filter out skills from navigation if embedded or placed beside profile
    const navSections = visibleSections.filter(s => !(s.id === 'skills' && (pLayout.embedsTechnologies || layout.skills?.placement === 'profile-description-side')));

    const navHtml = hLayout.showNavigation ? `
      <nav>
        ${navSections.map(s => `<a href="#${s.id}">${renderI18n('portfolio.nav.' + s.id)}</a>`).join('')}
        ${languageSettings.supportedLanguages.length > 1 ? `
          <select id="lang-selector" style="background:transparent; color:inherit; border:1px solid var(--border); border-radius:4px; padding:2px; font-size:0.8rem; margin-left:1rem;">
            ${languageSettings.supportedLanguages.map(l => `<option value="${l}">${l.toUpperCase()}</option>`).join('')}
          </select>
        ` : ''}
      </nav>
    ` : '';

    return `<header class="site-header"><div class="brand">${brandHtml}</div>${navHtml}</header>`;
  };

  // --- Render Hero ---
  const renderHero = () => {
    if (pLayout.variant === 'custom-orbit-builder') {
      const zones = pLayout.zones as Record<string, string>;
      const getZoneHtml = (id: string) => {
        if (id === 'name') return nameHtml;
        if (id === 'headline') return headlineHtml;
        if (id === 'links') return linksHtml;
        if (id === 'description') return bioHtml;
        if (id === 'technologies' && pLayout.embedsTechnologies) return techHtml;
        if (id === 'avatar') return avatarHtml;
        return '';
      };
      
      const gridItems = Object.entries(zones).map(([zone, id]) => {
        if (!id) return '';
        const html = getZoneHtml(id);
        if (!html) return '';
        return `<div style="grid-area: ${zone.toLowerCase()}">${html}</div>`;
      }).join('');

      return `<section id="hero" class="hero"><div class="hero-custom-orbit">${gridItems}</div></section>`;
    }

    if (pLayout.variant === 'center-orbit') {
      const parts: Record<string, string> = { name: nameHtml, links: linksHtml, headline: headlineHtml };
      const orbitHtml = pLayout.cornerItemsOrder.map((key, i) => `<div class="orbit-item-${i}">${parts[key]}</div>`).join('');
      return `
        <section id="hero" class="hero">
          <div class="hero-center-orbit">
            ${avatarHtml}
            ${orbitHtml}
          </div>
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
            ${bioHtml}
            ${pLayout.embedsTechnologies ? techHtml : ''}
          </div>
        </section>
      `;
    }

    if (pLayout.variant === 'avatar-side') {
      return `
        <section id="hero" class="hero hero-avatar-side">
          ${avatarHtml}
          <div>
            ${nameHtml}
            ${headlineHtml}
            ${bioHtml}
            ${linksHtml}
          </div>
        </section>
      `;
    }

    return `
      <section id="hero" class="hero hero-stacked-center">
        ${avatarHtml}
        ${nameHtml}
        ${headlineHtml}
        ${bioHtml}
        ${linksHtml}
      </section>
    `;
  };

  // --- Render Projects ---
  const renderProjects = () => {
    if (projects.length === 0) return '';
    const isCarousel = prLayout.carousel.enabled;
    const cardClass = prLayout.cardStyle;
    
    const renderLocalizedProjectDesc = (p: typeof projects[0]) => {
      if (languageSettings.supportedLanguages.length === 0) return escapeHtml(p.shortDescription || p.description);
      return languageSettings.supportedLanguages.map(lang => {
        const { description } = resolveProjectTranslation(p, lang, languageSettings);
        return `<span class="i18n-lang" data-lang="${lang}">${escapeHtml(description)}</span>`;
      }).join('');
    };

    const cardsHtml = projects.map(p => {
      const maxTechs = 6;
      const displayTechs = p.technologies.slice(0, maxTechs);
      const extraTechs = p.technologies.length > maxTechs ? p.technologies.length - maxTechs : 0;
      
      const techHtml = displayTechs.map(t => `<span class="tech-badge" style="margin:0;">${escapeHtml(t)}</span>`).join('') + 
        (extraTechs > 0 ? `<span class="tech-badge" style="margin:0; font-weight:600;">+${extraTechs}</span>` : '');

      return `
      <article class="project-card ${cardClass}">
        ${(settings.showProjectImages && p.image && cardClass !== 'text-card') ? `<img class="project-image" src="${escapeHtml(p.image.value)}" alt="${escapeHtml(p.title)}" loading="lazy" />` : ''}
        <div class="project-content">
          <h3 class="project-title">${escapeHtml(p.title)}</h3>
          <p class="project-desc">${renderLocalizedProjectDesc(p)}</p>
          <div class="project-tech" style="gap: 0.5rem;">
            ${techHtml}
          </div>
          <div class="project-links">
            ${p.links?.demo ? `<a href="${escapeHtml(p.links.demo)}" target="_blank" rel="noopener noreferrer" class="project-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              ${renderI18n('projects.view_project')}
            </a>` : ''}
            ${settings.showGitHubLinks && p.links?.repository ? `<a href="${escapeHtml(p.links.repository)}" target="_blank" rel="noopener noreferrer" class="project-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              ${renderI18n('projects.source_code')}
            </a>` : ''}
          </div>
        </div>
      </article>
      `;
    }).join('');

    if (isCarousel) {
      const dotsHtml = prLayout.carousel.paginationDots ? `
        <div class="carousel-pagination" id="carousel-dots"></div>
      ` : '';

      return `
        <section id="projects">
          <h2>${renderI18n('portfolio.sections.projects')}</h2>
          <div class="carousel-wrapper">
            <button class="carousel-arrow carousel-arrow-prev" aria-label="${escapeHtml(t('portfolio.previous_project'))}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div class="projects-carousel" id="projects-carousel">
              ${cardsHtml}
            </div>
            <button class="carousel-arrow carousel-arrow-next" aria-label="${escapeHtml(t('portfolio.next_project'))}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          ${dotsHtml}
        </section>
      `;
    }

    return `
      <section id="projects">
        <h2>${renderI18n('portfolio.sections.projects')}</h2>
        <div class="projects-grid">
          ${cardsHtml}
        </div>
      </section>
    `;
  };

  // --- Render Skills ---
  const renderSkills = () => {
    if (skills.length === 0 || pLayout.embedsTechnologies) return '';
    const style = layout.skills?.displayStyle || 'chips';
    const showNames = layout.skills?.showNames ?? true;
    const showIcons = layout.skills?.showIcons ?? false;
    const showCats = layout.skills?.showCategoryTitles ?? true;
    const isCompact = layout.skills?.compact ?? false;
    
    let contentHtml = '';
    
    const renderSkillItem = (s: typeof skills[0]) => {
      const nameHtml = showNames ? escapeHtml(s.name) : '';
      const iconHtml = (showIcons && s.icon) ? `<img src="${escapeHtml(s.icon)}" style="width: 16px; height: 16px; object-fit: contain;" alt=""/>` : (showIcons ? `<div style="width: 16px; height: 16px; border-radius: 50%; background: var(--muted);"></div>` : '');
      const inner = (iconHtml && nameHtml) ? `<span style="display:flex; align-items:center; gap: 0.4rem;">${iconHtml}<span>${nameHtml}</span></span>` : (iconHtml || nameHtml);
      
      if (style === 'icons') {
        return `<div style="display:flex; align-items:center; gap: 0.5rem; color: var(--text); padding: ${isCompact ? '0.25rem' : '0.5rem'} 0;">
          ${iconHtml || '◉'} ${nameHtml}
        </div>`;
      }
      
      if (style === 'icon-grid') {
        return `<div style="display:flex; flex-direction:column; align-items:center; gap: 0.5rem; background: var(--surface); padding: ${isCompact ? '0.75rem' : '1.25rem'}; border-radius: 12px; border: 1px solid var(--border); text-align: center;">
          ${showIcons ? (s.icon ? `<img src="${escapeHtml(s.icon)}" style="width: 32px; height: 32px; object-fit: contain;" alt=""/>` : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--border);"></div>`) : ''}
          ${showNames ? `<span style="font-size: 0.85rem; font-weight: 500;">${nameHtml}</span>` : ''}
        </div>`;
      }
      
      // Default: chips / grouped chips
      return `<span class="tech-badge" style="margin:0; ${isCompact ? 'padding: 0.2rem 0.6rem; font-size: 0.75rem;' : ''}">${inner}</span>`;
    };

    if (style === 'grouped') {
      const grouped: Record<string, typeof skills> = {};
      skills.forEach(s => {
        const cat = s.category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
      });
      
      contentHtml = Object.entries(grouped).map(([category, catSkills]) => `
        <div class="skill-category" style="margin-bottom: ${isCompact ? '1rem' : '2rem'};">
          ${showCats ? `<h3 style="font-size: 0.85rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);">${escapeHtml(category)}</h3>` : ''}
          <div style="display: flex; flex-wrap: wrap; gap: ${isCompact ? '0.25rem' : '0.5rem'};">
            ${catSkills.map(renderSkillItem).join('')}
          </div>
        </div>
      `).join('');
    } else if (style === 'icon-grid') {
      contentHtml = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(${isCompact ? '80px' : '100px'}, 1fr)); gap: ${isCompact ? '0.5rem' : '1rem'};">
          ${skills.map(renderSkillItem).join('')}
        </div>
      `;
    } else if (style === 'icons') {
      contentHtml = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: ${isCompact ? '0.5rem' : '1rem'};">
          ${skills.map(renderSkillItem).join('')}
        </div>
      `;
    } else {
      contentHtml = `
        <div style="display: flex; flex-wrap: wrap; gap: ${isCompact ? '0.25rem' : '0.5rem'};">
          ${skills.map(renderSkillItem).join('')}
        </div>
      `;
    }

    // Handle profile-description-side placement later (it requires changing the layout wrapper)
    // For now, if placement is beside-profile (or profile-description-side), we just render it. 
    // The wrapper CSS will put it in the right grid column if it's rendered as a section.
    
    return `
      <section id="skills" class="skills-section">
        <h2>${renderI18n('portfolio.sections.skills')}</h2>
        <div class="skills-wrapper">
          ${contentHtml}
        </div>
      </section>
    `;
  };

  // --- Render Career (Experience & Education) ---
  const renderCareer = () => {
    if (experiences.length === 0 && education.length === 0) return '';
    
    const expStyle = cLayout.sharedEntryStyle ? cLayout.entryStyle : cLayout.experienceStyle;
    const eduStyle = cLayout.sharedEntryStyle ? cLayout.entryStyle : cLayout.educationStyle;

    const renderEntry = (item: any, style: string, index: number) => {
      const isEdu = 'institution' in item;
      const title = isEdu ? item.course : item.position;
      const subtitle = isEdu ? item.institution : item.company;
      const date = (item.startDate || '') + ' - ' + (item.current ? t('experience.fields.present') : (item.endDate || ''));
      
      const content = `
        <span class="entry-date">${escapeHtml(date)}</span>
        <h3 class="entry-title">${escapeHtml(title)}</h3>
        <div class="entry-subtitle">${escapeHtml(subtitle)}</div>
        ${item.description ? `<div class="entry-desc">${escapeHtml(item.description)}</div>` : ''}
      `;

      if (style === 'stepper') {
        return `
          <div class="entry-item">
            <div class="step-number">${index + 1}</div>
            <div class="step-content">${content}</div>
          </div>
        `;
      }

      return `<div class="entry-item">${content}</div>`;
    };

    const expHtml = experiences.length > 0 ? `
      <div class="career-block">
        <h3 style="margin-bottom: 1.5rem;">${renderI18n('experience.tabs.experience')}</h3>
        <div class="entry-list style-${expStyle}">
          ${experiences.map((e, i) => renderEntry(e, expStyle, i)).join('')}
        </div>
      </div>
    ` : '';

    const eduHtml = education.length > 0 ? `
      <div class="career-block">
        <h3 style="margin-bottom: 1.5rem;">${renderI18n('experience.tabs.education')}</h3>
        <div class="entry-list style-${eduStyle}">
          ${education.map((e, i) => renderEntry(e, eduStyle, i)).join('')}
        </div>
      </div>
    ` : '';

    if (cLayout.layout === 'tabs' && experiences.length > 0 && education.length > 0) {
      const isExpDefault = cLayout.defaultTab === 'experience';
      return `
        <section id="career" class="career-section">
          <h2>${renderI18n('editor.careerLayout.title')}</h2>
          <div class="career-tabs-header">
            <button class="career-tab-btn ${isExpDefault ? 'active' : ''}" data-target="tab-exp">${renderI18n('experience.tabs.experience')}</button>
            <button class="career-tab-btn ${!isExpDefault ? 'active' : ''}" data-target="tab-edu">${renderI18n('experience.tabs.education')}</button>
          </div>
          <div id="tab-exp" class="career-tab-content ${isExpDefault ? 'active' : ''}">
            <div class="entry-list style-${expStyle}">
              ${experiences.map((e, i) => renderEntry(e, expStyle, i)).join('')}
            </div>
          </div>
          <div id="tab-edu" class="career-tab-content ${!isExpDefault ? 'active' : ''}">
            <div class="entry-list style-${eduStyle}">
              ${education.map((e, i) => renderEntry(e, eduStyle, i)).join('')}
            </div>
          </div>
        </section>
      `;
    }

    const wrapperClass = cLayout.layout === 'side-by-side' ? 'career-grid career-side-by-side' : 'career-grid';
    
    return `
      <section id="career" class="career-section">
        <h2>${renderI18n('editor.careerLayout.title')}</h2>
        <div class="${wrapperClass}">
          ${expHtml}
          ${eduHtml}
        </div>
      </section>
    `;
  };

  // --- Compose ---
  let bodyContent = '';
  visibleSections.forEach(section => {
    if (section.id === 'hero') bodyContent += renderHero();
    if (section.id === 'projects') bodyContent += renderProjects();
    if (section.id === 'skills') bodyContent += renderSkills();
    if (section.id === 'career') bodyContent += renderCareer();
  });

  const scriptsHtml = `
        <script>
      // Language Switcher Logic
      const defaultLang = "${languageSettings.defaultLanguage}";
      const supportedLangs = ${JSON.stringify(languageSettings.supportedLanguages)};
      const langSelector = document.getElementById("lang-selector");
      
      function setLanguage(lang) {
        if (!supportedLangs.includes(lang)) lang = defaultLang;
        document.querySelectorAll('.i18n-lang').forEach(el => {
          if (el.getAttribute('data-lang') === lang) {
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });
        try { localStorage.setItem('portfolio_lang', lang); } catch(e) {}
        if (langSelector) langSelector.value = lang;
      }

      function getInitialLang() {
        try {
          const saved = localStorage.getItem('portfolio_lang');
          if (saved && supportedLangs.includes(saved)) return saved;
        } catch(e) {}
        
        const browserLang = navigator.language;
        // try exact match (pt-BR)
        if (supportedLangs.includes(browserLang)) return browserLang;
        // try 2-letter prefix match (pt)
        const prefix = browserLang.split('-')[0];
        const partialMatch = supportedLangs.find(l => l.startsWith(prefix));
        if (partialMatch) return partialMatch;
        
        return defaultLang;
      }

      const initialLang = getInitialLang();

      if (langSelector) {
        langSelector.addEventListener('change', (e) => setLanguage(e.target.value));
      }
      setLanguage(initialLang);

      // Scroll state preservation
      document.addEventListener("DOMContentLoaded", () => {
        try {
          const scrollY = sessionStorage.getItem("portfolio_preview_scroll");
          if (scrollY) window.scrollTo(0, parseInt(scrollY));
        } catch(e) {}
      });
      window.addEventListener("scroll", () => {
        try {
          sessionStorage.setItem("portfolio_preview_scroll", window.scrollY);
        } catch(e) {}
      });

      // Career Tabs Logic
      document.querySelectorAll('.career-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          if (!targetId) return;
          
          document.querySelectorAll('.career-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          document.querySelectorAll('.career-tab-content').forEach(c => c.classList.remove('active'));
          document.getElementById(targetId).classList.add('active');
        });
      });

      // Parallax Effects
      ${currentVisualTheme.backgroundEffects?.parallax ? `
      const mediaQueryParallax = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mediaQueryParallax.matches) {
        const blobs = document.querySelectorAll('.glow-blob');
        const intensity = ${currentVisualTheme.backgroundEffects?.parallaxIntensity === 'medium' ? 0.3 : 0.15};
        window.addEventListener('scroll', () => {
          window.requestAnimationFrame(() => {
            const scroll = window.scrollY;
            blobs.forEach((blob, i) => {
              const dir = i % 2 === 0 ? 1 : -1;
              blob.style.transform = \`translate3d(0, \${scroll * intensity * dir}px, 0)\`;
            });
          });
        });
      }
      ` : ''}

      // Reveal on scroll
      ${(animations as any)?.sectionReveal ? `
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('section').forEach(sec => observer.observe(sec));
      ` : ''}

      // Carousel Logic
      ${prLayout.carousel.enabled ? `
      const carousel = document.getElementById('projects-carousel');
      const prevBtn = document.querySelector('.carousel-arrow-prev');
      const nextBtn = document.querySelector('.carousel-arrow-next');
      const dotsContainer = document.getElementById('carousel-dots');
      let dots = [];
      
      if (carousel) {
        let isHovered = false;
        
        carousel.addEventListener('mouseenter', () => isHovered = true);
        carousel.addEventListener('mouseleave', () => isHovered = false);
        carousel.addEventListener('touchstart', () => isHovered = true);
        carousel.addEventListener('touchend', () => { setTimeout(() => isHovered = false, 1000); });

                const checkArrowsAndDots = () => {
          const canScroll = carousel.scrollWidth > carousel.clientWidth + 10;
          if (prevBtn) prevBtn.style.display = canScroll ? '' : 'none';
          if (nextBtn) nextBtn.style.display = canScroll ? '' : 'none';

          if (!dotsContainer) return;
          
          if (!canScroll) {
            dotsContainer.innerHTML = '';
            dots = [];
            return;
          }

          const totalPages = Math.ceil(carousel.scrollWidth / carousel.clientWidth);
          
          if (dots.length !== totalPages) {
            dotsContainer.innerHTML = Array.from({length: totalPages}).map((_, i) => 
              \`<div class="carousel-dot" data-index="\${i}"></div>\`
            ).join('');
            
            dots = document.querySelectorAll('.carousel-dot');
            dots.forEach(dot => {
              dot.addEventListener('click', (e) => {
                const pageIndex = parseInt(dot.getAttribute('data-index') || '0', 10);
                carousel.scrollLeft = pageIndex * carousel.clientWidth;
              });
            });
          }
        };

        const updateDots = () => {
          if (!dots.length) return;
          let pageIndex = Math.round(carousel.scrollLeft / carousel.clientWidth);
          const maxPage = dots.length - 1;
          
          if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10) {
            pageIndex = maxPage;
          }
          pageIndex = Math.min(pageIndex, maxPage);
          
          dots.forEach((dot, i) => {
            if (i === pageIndex) dot.classList.add('active');
            else dot.classList.remove('active');
          });
        };

        const scrollByItem = (dir) => {
          carousel.scrollLeft += dir * carousel.clientWidth;
        };

        window.addEventListener('resize', () => { checkArrowsAndDots(); updateDots(); });
        
        if (window.ResizeObserver) {
          new ResizeObserver(() => { checkArrowsAndDots(); updateDots(); }).observe(carousel);
        } else {
          setTimeout(() => { checkArrowsAndDots(); updateDots(); }, 100);
        }
        
        carousel.addEventListener('scroll', () => {
          window.requestAnimationFrame(updateDots);
        });

        if (prevBtn) prevBtn.addEventListener('click', () => scrollByItem(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => scrollByItem(1));

        ${prLayout.carousel.autoplay ? `
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (!mediaQuery.matches) {
          setInterval(() => {
            if (isHovered) return;
            let nextScroll = carousel.scrollLeft + carousel.clientWidth;
            if (nextScroll >= carousel.scrollWidth - 10) {
              carousel.scrollLeft = 0;
            } else {
              scrollByItem(1);
            }
          }, ${prLayout.carousel.intervalMs || 3000});
        }
        ` : ''}
      }
      ` : ''}
    </script>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(profile.name)} - Portfolio</title>
  <meta name="description" content="${escapeHtml(profile.headline)}">
  <style>${css}</style>
</head>
<body>
  ${glowsHTML}
  ${renderHeader()}
  <main class="container ${layout.skills?.placement === 'profile-description-side' ? 'beside-profile-layout' : ''}">
    ${bodyContent}
  </main>
  <footer>
    <div class="container">
      &copy; ${new Date().getFullYear()} ${escapeHtml(profile.name)}. ${renderI18n('portfolio.footer.rights')}
      <br><span style="opacity: 0.5; font-size: 0.75rem;">${renderI18n('portfolio.footer.builtWith')} Portfolio Builder</span>
    </div>
  </footer>
  ${scriptsHtml}

        <script>
          document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
              anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              });
            });
          });
        </script>

      </body>
</html>`;
}
