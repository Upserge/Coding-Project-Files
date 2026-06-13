import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { throttleTime, map } from 'rxjs/operators';
import { Firestore } from '@angular/fire/firestore';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { CursorSpotlight } from './cursor-spotlight';
import { MagneticButtons } from './magnetic-buttons';
import { getTechSVG, getTechLink, getProjectSVG } from './tech-icons';
import { ParticleField } from './particle-field';
import { Leaderboard } from './leaderboard';
import { FocusMode } from './focus-mode';
import { buildSymmetricCategories, TechCategoryDisplay } from './tech-grid';
import { ShaderHero } from './shader-hero';

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface ProjectItem {
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
  featured?: boolean;
}

export interface TechCategory {
  label: string;
  items: string[];
}

export interface ResumeData {
  name: string;
  title: string;
  contact: ContactInfo;
  links: LinkItem[];
  summary: string;
  technologies: string[];
  projects: ProjectItem[];
  experience?: { company: string; role: string; startDate: string; endDate?: string; description?: string }[];
}

const TECH_CATEGORIES: TechCategory[] = [
  { label: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'SQL'] },
  { label: 'Tools & platforms', items: ['Angular', 'Postman', 'JQL', 'DataBricks', 'Jenkins', 'Swagger'] },
];

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
    technologies: ['JavaScript', 'TypeScript', 'Angular', 'Python', 'SQL', 'Postman', 'JQL', 'DataBricks', 'Jenkins', 'Swagger'],
    projects: [
      {
        title: 'Resume Site',
        description: 'Interactive portfolio built with Angular, featuring animated timeline, keyboard shortcuts, and WebGL effects.',
        url: 'https://github.com/Upserge/Coding-Project-Files/tree/master/source/repos/cs-projects/ResumeSite',
        tags: ['Angular', 'WebGL', 'Firebase', 'Canvas'],
        featured: true,
      },
      {
        title: 'Gambdle',
        description: 'Once a day slot machine game. Feeling lucky?',
        url: 'https://gambdle-97592.web.app/',
        tags: ['Angular', 'Firebase'],
      },
      { title: 'Hunt and Hide', description: '3D multiplayer hide and seek game built with ThreeJS and WebGL.', url: 'https://huntandhide-a1a35.web.app/', tags: ['Angular', 'WebGL', 'ThreeJS'] },
      { title: 'Lil Green Ghouls', description: 'Ghost adventure blog, check it out and get spooked.', url: 'https://lilgreenghouls-fd542.web.app/', tags: ['JavaScript', 'TypeScript', 'React'] },
      { title: 'PAC-MAN', description: 'Collaborative PAC-MAN recreation, built with JavaScript and the HTML5 Canvas API.', url: 'https://gabrielp295.github.io/pacman-game/', tags: ['PACMAN', 'Game Development'] },
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
  private focusMode: FocusMode | null = null;
  private shaderHero: ShaderHero | null = null;

  private readonly firestore = inject(Firestore);
  private readonly destroyRef = inject(DestroyRef);

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

  initShaderHero() {
    this.shaderHero = new ShaderHero();
    this.shaderHero.init();
  }

  initHeroLogo() {
    const img = document.querySelector('.hero-logo') as HTMLImageElement | null;
    if (img) {
      img.decoding = 'async';
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
    this.focusMode?.destroy();
    this.focusMode = null;
    this.shaderHero?.destroy();
    this.shaderHero = null;
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
    this.particleField.init((points: number) => {
      this.score.update(s => s + points);
      this.leaderboard?.onScore(this.score());
      this.focusMode?.onScore(this.score());
    });
  }

  initLeaderboard() {
    this.leaderboard = new Leaderboard(this.firestore);
    this.leaderboard.init((storedBest) => {
      // Seed the score counter from Firestore so it's always cumulative.
      // Only apply if the player hasn't already scored in this session.
      if (storedBest > 0 && this.score() === 0) {
        this.score.set(storedBest);
      }
    });
  }

  initFocusMode() {
    this.focusMode = new FocusMode();
    this.focusMode.init();
  }

  showLeaderboard() {
    this.leaderboard?.showPanel();
  }

  closeLeaderboard() {
    this.leaderboard?.closePanel();
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

  getTechCategories(): TechCategoryDisplay[] {
    const categories = TECH_CATEGORIES.map((category) => ({
      label: category.label,
      items: category.items.filter((item) => this.data.technologies.includes(item)),
    }));

    return buildSymmetricCategories(categories);
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
    this.shaderHero?.updateTheme();
  }

  // ===== Scroll Navigation Management =====
  initScrollListener(): void {
    fromEvent(window, 'scroll').pipe(
      throttleTime(0, undefined, { trailing: true }),
      map(() => window.scrollY),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(scrollY => {
      const scrollDelta = Math.abs(scrollY - this.lastScrollY);
      if (scrollDelta > 10) {
        this.isNavHidden.set(scrollY > this.lastScrollY && scrollY > 100);
        this.lastScrollY = scrollY;
      }
    });
  }

}
