import { SortbyField } from '../src/sortby-field';

describe('SortbyField', () => {
  it('should instantiate with ascending sorting order as a default', () => {
    const field = 'title';
    const sortby = new SortbyField(field);

    expect(sortby).toBeInstanceOf(SortbyField);
    expect(sortby.args).toEqual([field, 'ASC']);
  });

  it('should instantiate with descending sorting order', () => {
    const field = 'title';
    const sortby = new SortbyField(field, false);

    expect(sortby).toBeInstanceOf(SortbyField);
    expect(sortby.args).toEqual([field, 'DESC']);
  });
});
