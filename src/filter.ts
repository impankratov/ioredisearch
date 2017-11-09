export enum FilterKeywords {
  Filter = 'FILTER',
  Geofilter = 'GEOFILTER'
}

export class Filter {
  public args: (string | number)[];

  constructor(
    keyword: FilterKeywords,
    field: string,
    ...args: (string | number)[]
  ) {
    this.args = [keyword, field, ...args];
  }
}

export class NumericFilter extends Filter {
  constructor(
    field: string,
    min: number,
    max: number,
    minExclusive = false,
    maxExclusive = false
  ) {
    const args = [
      minExclusive ? `(${min}` : min,
      maxExclusive ? `(${max}` : max
    ];

    super(FilterKeywords.Filter, field, ...args);
  }
}

// TODO: GeoFilter
