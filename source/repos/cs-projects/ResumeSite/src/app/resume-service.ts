import { Injectable, signal } from '@angular/core';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { CursorSpotlight } from './cursor-spotlight';
import { MagneticButtons } from './magnetic-buttons';
import { PerformanceMonitor } from './performance-monitor';
import { getTechSVG, getTechLink, getProjectSVG } from './tech-icons';
import { ParticleField } from './particle-field';

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface ResumeData {
  name: string;
  title: string;
  contact: ContactInfo;
  links: LinkItem[];
  summary: string;
  technologies: string[];
  projects: { title: string; description?: string; url?: string }[];
  experience?: { company: string; role: string; startDate: string; endDate?: string; description?: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private data: ResumeData = {
    name: 'Jason Salas',
    title: 'Software Developer',
    contact: {
      email: 'jasoncsalas@gmail.com',
      phone: '+1 (951) 385-6192',
      location: 'Santa Barbara, CA',
    },
    links: [
      { label: 'GitHub', url: 'https://github.com/upserge' },
      { label: 'LeetCode', url: 'https://leetcode.com/upserge' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/jasoncsalas' },
    ],
    summary:
      'Results-driven software developer experienced building web applications and backend services. Strong foundation in JavaScript, Angular, Python, and SQL. Comfortable working across the stack and delivering maintainable code.',
    technologies: ['JavaScript', 'Angular', 'Python', 'SQL', 'Postman', 'JQL', 'DataBricks', 'Jenkins', 'Swagger'],
    projects: [
      { title: 'Resume Site', description: 'Interactive portfolio built with Angular, featuring animated timeline, keyboard shortcuts, and WebGL effects.', url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/cs-projects/ResumeSite' },
      { title: 'PokeDex', description: 'Pokémon encyclopedia app with search, filtering, and detailed stat breakdowns.', url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/PokeDex' },
      { title: 'Deck of Cards', description: 'Card game engine with shuffle, draw, and hand management mechanics.', url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/deckOfCards' },
      { title: 'Number Guesser', description: 'Number guessing game with difficulty levels and score tracking.', url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/NumberGuesser' },
      { title: 'Array Algorithms', description: 'Visual implementations of sorting and searching algorithms with step-by-step animations.', url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/ArrayAlgorithms' },
      { title: 'Book Tracker', description: 'Reading list manager for tracking books, progress, and reviews.', url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/cs-projects/book-tracker' },
    ],
    experience: [
      { company: 'Riot Games', role: 'QA Engineer III | Premier | VALORANT', startDate: '2022', endDate: undefined, description: '' },
      { company: 'Riot Games', role: 'QA Engineer II | Competitive | VALORANT', startDate: '2020', endDate: '2022', description: '' },
      { company: 'ReSci', role: 'Tech Support Analyst', startDate: '2019', endDate: '2020', description: '' },
      { company: 'Manageware Solutions', role: 'Software Analyst', startDate: '2018', endDate: '2019', description: '' },
      { company: 'Mobelisk', role: 'Software/Hardware Analyst', startDate: '2017', endDate: '2018', description: '' },
      { company: 'SpaceX', role: 'Intern', startDate: '2014', endDate: '2014', description: '' },
    ],
  };

  // UI State Signals
  readonly isDarkMode = signal<boolean>(true);
  readonly activeSection = signal<string>('');
  readonly isNavHidden = signal<boolean>(false);
  readonly highlightedSection = signal<string | null>(null);
  readonly selectedTechnologies = signal<string[]>([]);

  private lastScrollY = 0;
  // reveal observer for element reveal-on-scroll
  private revealObserver: IntersectionObserver | null = null;

  // hero animation tracking
  private heroAnimationFrame: number | null = null;
  private heroResizeHandler: (() => void) | null = null;

  // advanced effects
  private keyboardShortcuts: KeyboardShortcuts | null = null;
  private cursorSpotlight: CursorSpotlight | null = null;
  private magneticButtons: MagneticButtons | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;
  private particleField: ParticleField | null = null;

  constructor() {
    this.initTheme();
    this.initPerformanceMonitoring();
  }

  private initPerformanceMonitoring() {
    this.performanceMonitor = new PerformanceMonitor();
    this.performanceMonitor.init();
    PerformanceMonitor.enableCSSContainment();
  }

  // ===== View Animations (moved from App component) =====
  initReveal() {
    if (typeof IntersectionObserver === 'undefined') return;
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.classList.add('visible');
            if (this.revealObserver) this.revealObserver.unobserve(el);
          }
        }
      },
      { threshold: 0.12 }
    );

    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => this.revealObserver?.observe(el));
    }, 50);
  }

  initHero() {
    const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const canvasEl: HTMLCanvasElement = canvas;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvasEl.getBoundingClientRect();
      canvasEl.width = Math.max(1, Math.floor(rect.width * DPR));
      canvasEl.height = Math.max(1, Math.floor(rect.height * DPR));
    };

    resize();
    window.addEventListener('resize', resize);
    this.heroResizeHandler = resize;

    const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      particles.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0008, vy: (Math.random() - 0.5) * 0.0008, r: 1 + Math.random() * 2 });
    }

    const render = () => {
      const w = canvas.width / DPR;
      const h = canvas.height / DPR;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(DPR, DPR);

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(111,92,255,0.06)');
      g.addColorStop(1, 'rgba(94,234,212,0.03)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      particles.forEach(p => {
        p.x += p.vx * w;
        p.y += p.vy * h;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05;
        if (p.y > 1.05) p.y = -0.05;

        const px = p.x * w;
        const py = p.y * h;
        const rad = p.r * 2;
        const rg = ctx.createRadialGradient(px, py, 0, px, py, rad * 4);
        rg.addColorStop(0, 'rgba(255,255,255,0.7)');
        rg.addColorStop(0.2, 'rgba(124,92,255,0.25)');
        rg.addColorStop(1, 'rgba(124,92,255,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(px, py, rad * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      this.heroAnimationFrame = requestAnimationFrame(render);
    };

    render();
  }

  async initLottie() {
    const holder = document.getElementById('lottie-holder');
    if (!holder) return;
    try {
      const mod = await import('lottie-web');
      const lottie: any = (mod as any).default ?? mod;
      const animData = {
        v: '5.7.4',
        fr: 30,
        ip: 0,
        op: 60,
        w: 200,
        h: 200,
        nm: 'pulse',
        assets: [],
        layers: [
          {
            ty: 4,
            nm: 'circle',
            shapes: [
              {
                ty: 'el',
                p: { a: 0, k: [100, 100] },
                s: { a: 1, k: [{ t: 0, s: [0, 0] }, { t: 30, s: [120, 120] }, { t: 60, s: [0, 0] }] },
              },
              { ty: 'fl', c: { a: 0, k: [1, 1, 1, 0.15] } },
            ],
            ip: 0,
            op: 60,
          },
        ],
      } as any;

      lottie.loadAnimation({
        container: holder,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animData,
      });
    } catch (e) {
      // lottie not available — ignore
    }
  }

  // cleanup any resources created by init* methods
  dispose() {
    this.revealObserver?.disconnect();
    this.revealObserver = null;
    if (this.heroAnimationFrame !== null) {
      cancelAnimationFrame(this.heroAnimationFrame);
      this.heroAnimationFrame = null;
    }
    if (this.heroResizeHandler) {
      window.removeEventListener('resize', this.heroResizeHandler);
      this.heroResizeHandler = null;
    }
    this.keyboardShortcuts?.destroy();
    this.keyboardShortcuts = null;
    this.cursorSpotlight?.destroy();
    this.cursorSpotlight = null;
    this.magneticButtons?.destroy();
    this.magneticButtons = null;
    this.particleField?.destroy();
    this.particleField = null;
  }

  // ===== Advanced Effects Initialization =====
  initKeyboardShortcuts(callbacks: { [key: string]: () => void }) {
    this.keyboardShortcuts = new KeyboardShortcuts();
    Object.entries(callbacks).forEach(([key, callback]) => {
      this.keyboardShortcuts?.register(key, callback);
    });
    this.keyboardShortcuts?.init();
  }

  initCursorSpotlight() {
    this.cursorSpotlight = new CursorSpotlight();
    this.cursorSpotlight.init();
  }

  initMagneticButtons() {
    this.magneticButtons = new MagneticButtons();
    this.magneticButtons.init();
  }

  initParticleField() {
    this.particleField = new ParticleField();
    this.particleField.init();
  }

  // ===== SVG Tech Icons =====
  getTechSVG(tech: string): string {
    return getTechSVG(tech);
  }

  getTechLink(tech: string): string {
    return getTechLink(tech);
  }

  getProjectSVG(title: string): string {
    return getProjectSVG(title);
  }

  getPerformanceVitals() {
    return this.performanceMonitor?.getVitals() ?? {};
  }

  // ===== User Interaction Methods =====
  toggleTechnology(tech: string) {
    const current = this.selectedTechnologies();
    if (current.includes(tech)) {
      this.selectedTechnologies.set(current.filter((t) => t !== tech));
    } else {
      this.selectedTechnologies.set([...current, tech]);
    }
  }

  isTechSelected(tech: string): boolean {
    return this.selectedTechnologies().includes(tech);
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      this.highlightedSection.set(id);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        this.highlightedSection.set(null);
      }, 2500);
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  highlightAndScroll(id: string) {
    this.scrollTo(id);
  }

  // ===== Resume Data Methods =====
  getResume(): ResumeData {
    // Return a shallow copy to avoid accidental external mutation
    return {
      ...this.data,
      links: [...this.data.links],
      technologies: [...this.data.technologies],
      projects: [...this.data.projects],
    };
  }

  updateContact(contact: Partial<ContactInfo>) {
    this.data.contact = { ...this.data.contact, ...contact };
  }

  // ===== Dark Mode Management =====
  private initTheme() {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      this.isDarkMode.set(saved === 'true');
    }
    this.applyTheme();
  }

  toggleDarkMode(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    localStorage.setItem('darkMode', newValue.toString());
    this.applyTheme();
  }

  private applyTheme(): void {
    const html = document.documentElement;
    if (this.isDarkMode()) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.setAttribute('data-theme', 'light');
    }
  }

  // ===== Section Active State Tracking =====
  initActiveSectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            this.activeSection.set((e.target as HTMLElement).id);
          }
        });
      },
      { threshold: 0.3 }
    );

    setTimeout(() => {
      document.querySelectorAll('.section').forEach((el) => observer.observe(el));
    }, 100);
  }

  // ===== Scroll Navigation Management =====
  initScrollListener(): void {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const isScrollingDown = scrollY > this.lastScrollY;
          const scrollDelta = Math.abs(scrollY - this.lastScrollY);

          // Only hide/show if scroll delta is significant (avoid jitter)
          if (scrollDelta > 10) {
            this.isNavHidden.set(isScrollingDown && scrollY > 100);
            this.lastScrollY = scrollY;
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ===== Technology Icon Mapping =====
  getTechIcon(tech: string): string {
    const t = tech.toLowerCase();
    if (t.includes('javascript') || t === 'js') return '🟨';
    if (t.includes('angular')) return '🅰️';
    if (t.includes('python')) return '🐍';
    if (t.includes('sql')) return '🗄️';
    if (t.includes('postman')) return '📮';
    return '🔧';
  }
}
