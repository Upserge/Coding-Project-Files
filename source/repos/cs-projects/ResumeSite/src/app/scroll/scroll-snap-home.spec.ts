import {
  ScrollSnapHome,
  resolveActiveNavSection,
  shouldEnableScrollSnap,
} from './scroll-snap-home';

function mockMediaQueryList(matches: boolean, media = ''): MediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList;
}

describe('scroll-snap-home', () => {
  describe('shouldEnableScrollSnap', () => {
    it('returns false when flag is off', () => {
      expect(shouldEnableScrollSnap({ scrollNarrative: false })).toBeFalse();
    });

    it('returns false when reduced motion is preferred', () => {
      spyOn(window, 'matchMedia').and.callFake((query: string) =>
        mockMediaQueryList(query.includes('prefers-reduced-motion'), query),
      );

      expect(shouldEnableScrollSnap({ scrollNarrative: true })).toBeFalse();
    });

    it('returns false below desktop breakpoint', () => {
      spyOn(window, 'matchMedia').and.callFake((query: string) =>
        mockMediaQueryList(query.includes('max-width'), query),
      );

      expect(shouldEnableScrollSnap({ scrollNarrative: true })).toBeFalse();
    });

    it('returns true on desktop without reduced motion', () => {
      spyOn(window, 'matchMedia').and.returnValue(mockMediaQueryList(false));

      expect(shouldEnableScrollSnap({ scrollNarrative: true })).toBeTrue();
    });
  });

  describe('resolveActiveNavSection', () => {
    it('picks the section nearest the nav offset', () => {
      const root = document.createElement('div');
      const work = document.createElement('section');
      work.id = 'work';
      root.appendChild(work);

      spyOn(work, 'getBoundingClientRect').and.returnValue({
        top: 50,
        bottom: 900,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      expect(resolveActiveNavSection(root, 52, [{ navId: 'work', element: work }])).toBe('work');
    });
  });

  describe('ScrollSnapHome', () => {
    it('enables snap classes and removes them on destroy', () => {
      spyOn(window, 'matchMedia').and.returnValue(mockMediaQueryList(false));

      const controller = new ScrollSnapHome({ scrollNarrative: true }, () => undefined);
      controller.init();

      expect(document.documentElement.classList.contains('scroll-snap-enabled')).toBeTrue();
      expect(document.documentElement.getAttribute('data-scroll-snap')).toBe('on');

      controller.destroy();

      expect(document.documentElement.classList.contains('scroll-snap-enabled')).toBeFalse();
      expect(document.documentElement.getAttribute('data-scroll-snap')).toBeNull();
    });

    it('does not enable when guards fail', () => {
      const controller = new ScrollSnapHome({ scrollNarrative: false }, () => undefined);
      controller.init();

      expect(document.documentElement.classList.contains('scroll-snap-enabled')).toBeFalse();
      controller.destroy();
    });
  });
});
