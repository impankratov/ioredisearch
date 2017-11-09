import { Filter, FilterKeywords, NumericFilter } from '../src/filter';

describe('Filter', () => {
  it('should instantiate with arguments', () => {
    const field = 'title';
    const otherArgs = ['some', 'args'];
    const filter = new Filter(FilterKeywords.Filter, field, ...otherArgs);

    expect(filter).toBeInstanceOf(Filter);
    expect(filter.args).toEqual([FilterKeywords.Filter, field, ...otherArgs]);
  });
});

describe('NumericFilter', () => {
  it(`should instantiate 'min' & 'max' arguments`, () => {
    const field = 'comments';
    const min = 100;
    const max = 500;
    const filter = new NumericFilter(field, min, max);

    expect(filter).toBeInstanceOf(NumericFilter);
    expect(filter.args).toEqual([FilterKeywords.Filter, field, min, max]);
  });

  it(`should instantiate with 'minExclusive' & 'maxExclusive' arguments`, () => {
    const field = 'comments';
    const min = 100;
    const max = 500;
    const filter = new NumericFilter(field, min, max, true, true);

    expect(filter).toBeInstanceOf(NumericFilter);
    expect(filter.args).toEqual([
      FilterKeywords.Filter,
      field,
      `(${min}`,
      `(${max}`
    ]);
  });
});
