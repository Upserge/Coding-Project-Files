import { buildSymmetricCategories, computeSymmetricGrid, padCategorySlots } from './tech-grid';

describe('tech-grid', () => {
  it('balances four and six items into two rows of three columns', () => {
    expect(computeSymmetricGrid([4, 6])).toEqual({ columns: 3, rows: 2 });
  });

  it('pads categories to the same grid footprint', () => {
    const categories = buildSymmetricCategories([
      { label: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'SQL'] },
      { label: 'Tools & platforms', items: ['Angular', 'Postman', 'JQL', 'DataBricks', 'Jenkins', 'Swagger'] },
    ]);

    expect(categories).toHaveSize(2);
    expect(categories[0].columns).toBe(3);
    expect(categories[0].rows).toBe(2);
    expect(categories[0].slots).toEqual([
      'JavaScript',
      'TypeScript',
      'Python',
      'SQL',
      null,
      null,
    ]);
    expect(categories[1].slots.filter(Boolean)).toHaveSize(6);
    expect(categories[1].slots).toHaveSize(6);
  });

  it('handles a single category independently', () => {
    expect(computeSymmetricGrid([5])).toEqual({ columns: 3, rows: 2 });
    expect(padCategorySlots(['A', 'B', 'C', 'D', 'E'], 3, 2)).toEqual(['A', 'B', 'C', 'D', 'E', null]);
  });
});
