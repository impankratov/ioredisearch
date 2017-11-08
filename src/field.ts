enum FieldArgs {
  Numeric = 'NUMERIC',
  Text = 'TEXT',
  Weight = 'WEIGHT',
  Geo = 'GEO',
  Sortable = 'SORTABLE',
  NoIndex = 'NOINDEX',
  NoStem = 'NOSTEM'
}

export class Field {
  public name: string;
  private args: any[];
  constructor(name: string, ...args: any[]) {
    this.name = name;
    this.args = args;
  }

  public get redisArgs(): any[] {
    return [this.name, ...this.args];
  }
}

export class TextField extends Field {
  constructor(
    name: string,
    weight = 1.0,
    sortable = false,
    noStem = false,
    noIndex = false
  ) {
    const args = [FieldArgs.Text, FieldArgs.Weight, weight];

    if (sortable) {
      args.push(FieldArgs.Sortable);
    }

    if (noStem) {
      args.push(FieldArgs.NoStem);
    }

    if (noIndex) {
      args.push(FieldArgs.NoIndex);
    }

    if (noIndex && !sortable) {
      throw new Error('Non-Sortable non-Indexable fields are ignored');
    }

    super(name, ...args);
  }
}

export class NumericField extends Field {
  constructor(name: string, sortable = false, noIndex = false) {
    const args = [FieldArgs.Numeric];

    if (sortable) {
      args.push(FieldArgs.Sortable);
    }

    if (noIndex) {
      args.push(FieldArgs.NoIndex);
    }

    if (noIndex && !sortable) {
      throw new Error('Non-Sortable non-Indexable fields are ignored');
    }

    super(name, ...args);
  }
}
