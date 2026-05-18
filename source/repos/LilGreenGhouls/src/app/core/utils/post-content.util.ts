const ZERO_WIDTH_CHARS = /[\u200B-\u200D\uFEFF]/g;
const NBSP = /\u00A0/g;
const WHITESPACE_RUN = /\s+/g;
const SPACE_BEFORE_PUNCTUATION = /([^\s\d])\s+([.,;:!?]+)/g;
const PRESERVE_TAGS = new Set(['PRE', 'CODE']);

/** Normalizes Quill HTML before persisting to Firestore. */
export function normalizePostContentHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }

  if (typeof DOMParser === 'undefined') {
    return normalizePostContentHtmlFallback(trimmed);
  }

  const doc = new DOMParser().parseFromString(trimmed, 'text/html');
  const body = doc.body;

  stripLayoutBreakingAttributes(body);
  normalizeElementTree(body);

  const normalized = body.innerHTML.trim();
  return normalized || '';
}

/** Text-node cleanup — safe to unit test without a DOM. */
export function normalizePlainTextSegment(text: string): string {
  const withoutZeroWidth = text.replace(ZERO_WIDTH_CHARS, '').replace(NBSP, ' ');
  const collapsed = withoutZeroWidth.replace(WHITESPACE_RUN, ' ');
  const withoutSpaceBeforePunctuation = collapsed.replace(SPACE_BEFORE_PUNCTUATION, '$1$2');
  return withoutSpaceBeforePunctuation.trim();
}

function normalizePostContentHtmlFallback(html: string): string {
  return html
    .replace(ZERO_WIDTH_CHARS, '')
    .replace(NBSP, ' ')
    .replace(/style="[^"]*"/gi, '')
    .replace(SPACE_BEFORE_PUNCTUATION, '$1$2')
    .replace(WHITESPACE_RUN, ' ')
    .trim();
}

function stripLayoutBreakingAttributes(root: ParentNode): void {
  root.querySelectorAll('[style], [width], [height]').forEach(element => {
    element.removeAttribute('style');
    element.removeAttribute('width');
    element.removeAttribute('height');
  });
}

function normalizeElementTree(root: ParentNode): void {
  const nodes = [...root.childNodes];

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent || PRESERVE_TAGS.has(parent.tagName)) {
        continue;
      }
      const normalized = normalizePlainTextSegment(node.textContent ?? '');
      node.textContent = normalized;
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = node as Element;
    if (PRESERVE_TAGS.has(element.tagName)) {
      continue;
    }

    unwrapRedundantSpan(element);
    normalizeElementTree(element);
    removeIfEmptySpan(element);
  }
}

function unwrapRedundantSpan(span: Element): void {
  if (span.tagName !== 'SPAN') {
    return;
  }

  const hasAttributes = [...span.attributes].some(
    attr => attr.name !== 'class' || attr.value.trim().length > 0,
  );
  if (hasAttributes) {
    return;
  }

  const parent = span.parentNode;
  if (!parent) {
    return;
  }

  while (span.firstChild) {
    parent.insertBefore(span.firstChild, span);
  }
  parent.removeChild(span);
}

function removeIfEmptySpan(element: Element): void {
  if (element.tagName !== 'SPAN') {
    return;
  }

  const hasMeaningfulAttributes = [...element.attributes].some(
    attr => attr.name === 'class' && attr.value.trim().length > 0,
  );
  if (hasMeaningfulAttributes) {
    return;
  }

  const text = element.textContent?.trim() ?? '';
  if (text.length > 0) {
    return;
  }

  element.remove();
}
