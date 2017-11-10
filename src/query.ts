import * as R from 'ramda';

import { Filter } from './filter';
import { SortbyField } from './sortby-field';

export class Query {
  public _noContent: boolean = false;
  public _withPayloads: boolean = false;
  private _queryString: string;
  private _offset: number = 0;
  private _num: number = 10;
  private _noStopwords: boolean = false;
  private _fields: string[] = [];
  private _verbatim: boolean = false;
  private _filters: Filter[] = [];
  private _ids: (string | number)[] = [];
  private _slop: number = -1;
  private _inOrder: boolean = false;
  private _sortby: SortbyField;
  private _returnFields: string[] = [];

  constructor(queryString: string) {
    this._queryString = queryString;
  }

  /**
   * Return the query string of this query only
   */
  public get queryString(): string {
    return this._queryString;
  }

  /**
   * Limit the results to a specific set
   * of pre-known document ids of any length
   */
  public limitIds(ids: string[]) {
    this._ids = ids;
    return this;
  }

  /**
   * Only return values from these fields
   */
  public returnFields(fields: string[]) {
    this._returnFields = fields;
    return this;
  }

  /**
   * Allow a maximum of N intervening
   * non matched terms between phrase terms
   * (0 means exact phrase)
   */
  public slop(slop: number) {
    this._slop = slop;
    return this;
  }

  /**
   * Set the paging for the query (defaults to 0..10).
   * @param offset Paging offset for the results. Defaults to 0
   * @param num How many results do we want
   */
  public paging(offset: number, num: number) {
    this._offset = offset;
    this._num = num;
    return this;
  }

  /**
   * Set the query to be verbatim,
   * i.e. use no query expansion or stemming
   */
  public verbatim() {
    this._verbatim = true;
    return this;
  }

  /**
   * Set the query to only return ids and not the document content
   */
  public noContent() {
    this._noContent = true;
    return this;
  }

  /**
   * Prevent the query from being filtered for stopwords.
   * Only useful in very big queries
   * that you are certain contain no stopwords.
   */
  public noStopwords() {
    this._noStopwords = true;
    return this;
  }

  /**
   * Ask the engine to return document payloads
   */
  public withPayload() {
    this._withPayloads = true;
    return this;
  }

  /**
   * Limit the search to specific TEXT fields only
   * @param fields A list of strings, case sensitive field names from the defined schema
   */
  public limitFields(fields: string[]) {
    this._fields = fields;
    return this;
  }

  /**
   * Add a numeric or geo filter to the query.
   * **Currently only one of each filter is supported by the engine**
   * @param Filter A NumericFilter or GeoFilter object, used on a corresponding field
   */
  public addFilter(filter: Filter) {
    this._filters.push(filter);
    return this;
  }

  /**
   * Add a sortby field to the query
   * @param field the name of the field to sort by
   * @param asc when `true`, sorting will be done in ascending order
   */
  public sortBy(field: string, asc = true) {
    this._sortby = new SortbyField(field, asc);
    return this;
  }

  /**
   * Match only documents where the query terms
   * appear in the same order in the document.
   * i.e. for the query 'hello world',
   * we do not match 'world hello'
   */
  public inOrder() {
    this._inOrder = true;
    return this;
  }

  /**
   * Format the redis arguments
   * for this query and return them
   */
  public get args(): (string | number)[] {
    const args: (string | number)[] = [this._queryString];

    if (this._noContent) {
      args.push('NOCONTENT');
    }

    if (this._fields.length > 0) {
      args.push('INFIELDS', this._fields.length, ...this._fields);
    }

    if (this._verbatim) {
      args.push('VERBATIM');
    }

    if (this._noStopwords) {
      args.push('NOSTOPWORDS');
    }

    args.push(
      ...R.pipe<Filter[], Filter[], any[][], any[]>(
        R.filter<Filter>(R.is(Filter)),
        R.pluck<Filter, 'args'>('args'),
        R.unnest
      )(this._filters)
    );

    if (this._withPayloads) {
      args.push('WITHPAYLOADS');
    }

    if (this._ids.length > 0) {
      args.push('INKEYS', this._ids.length, ...this._ids);
    }

    if (this._slop > 0) {
      args.push('SLOP', this._slop);
    }

    if (this._inOrder) {
      args.push('INORDER');
    }

    if (this._returnFields.length > 0) {
      args.push('RETURN', this._returnFields.length, ...this._returnFields);
    }

    if (this._sortby) {
      args.push('SORTBY', ...this._sortby.args);
    }

    args.push('LIMIT', this._offset, this._num);

    return args;
  }
}
