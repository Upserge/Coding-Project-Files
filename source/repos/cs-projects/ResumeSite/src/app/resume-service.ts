import { Injectable, signal } from '@angular/core';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { CursorSpotlight } from './cursor-spotlight';
import { MagneticButtons } from './magnetic-buttons';
import { getTechSVG, getTechLink, getProjectSVG } from './tech-icons';
import { ParticleField } from './particle-field';
import { Leaderboard } from './leaderboard';

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
      { company: 'Riot Games', role: 'QA Engineer III | Premier | VALORANT', startDate: '2022', endDate: undefined, description: 'QA Engineering Lead for Premier features' },
      { company: 'Riot Games', role: 'QA Engineer II | Competitive | VALORANT', startDate: '2020', endDate: '2022', description: 'QA Engineering Lead for Competitive features' },
      { company: 'ReSci', role: 'Tech Analyst', startDate: '2019', endDate: '2020', description: 'Solved technical problems for clients who utilized Retention Science and created internal tools for CSM and Sales Engineers to optimize their workflow.' },
      { company: 'Manageware Solutions', role: 'Software Analyst', startDate: '2018', endDate: '2019', description: 'Specialized in debugging, system reliability, SQL/data analysis, feature implementation, and automation engineering for Medical software.' },
      { company: 'Mobelisk', role: 'Software/Hardware Analyst', startDate: '2017', endDate: '2018', description: 'Engineer specializing in firmware validation, IoT systems testing, QA engineering, PCB/software deployment, and prototype development.' },
      { company: 'SpaceX', role: 'CS Intern', startDate: '2014', endDate: '2014', description: 'CS internship at SpaceX facility in Hawthorne, specifically focused on supply chain system prototyping.' },
    ],
  };

  // UI State Signals
  readonly isDarkMode = signal<boolean>(true);
  readonly isNavHidden = signal<boolean>(false);
  readonly highlightedSection = signal<string | null>(null);
  readonly score = signal<number>(0);

  private lastScrollY = 0;
  // reveal observer for element reveal-on-scroll
  private revealObserver: IntersectionObserver | null = null;

  // advanced effects
  private keyboardShortcuts: KeyboardShortcuts | null = null;
  private cursorSpotlight: CursorSpotlight | null = null;
  private magneticButtons: MagneticButtons | null = null;
  private particleField: ParticleField | null = null;
  private leaderboard: Leaderboard | null = null;

  constructor() {
    this.initTheme();
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
          } else {
            el.classList.remove('visible');
          }
        }
      },
      { threshold: 0.15, rootMargin: '-60px 0px' }
    );

    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => this.revealObserver?.observe(el));
    }, 50);
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
    this.keyboardShortcuts?.destroy();
    this.keyboardShortcuts = null;
    this.cursorSpotlight?.destroy();
    this.cursorSpotlight = null;
    this.magneticButtons?.destroy();
    this.magneticButtons = null;
    this.particleField?.destroy();
    this.particleField = null;
    this.leaderboard?.destroy();
    this.leaderboard = null;
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
    this.particleField.init(() => {
      this.score.update(s => s + 1);
      this.leaderboard?.onScore(this.score());
    });
  }

  initLeaderboard() {
    this.leaderboard = new Leaderboard();
    this.leaderboard.init();
  }

  showLeaderboard() {
    this.leaderboard?.showPanel();
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

  // ===== User Interaction Methods =====
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

  // ===== Resume Data Methods =====
  getResume(): ResumeData {
    return {
      ...this.data,
      links: [...this.data.links],
      technologies: [...this.data.technologies],
      projects: [...this.data.projects],
    };
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

}
