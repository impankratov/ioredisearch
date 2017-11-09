// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...
import { Redis } from 'ioredis';
import * as R from 'ramda';

import { Field } from './field';
import { Query } from './query';
import { Result } from './result';

export interface SchemaDictionary {
  [key: string]: any;
}

export interface NumericDictionary {
  [key: string]: number;
}
export type SearchDictionary = NumericDictionary;
export type SnippetsDictionary = NumericDictionary;

export type DocumentScore = 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;

enum Commands {
  Create = 'FT.CREATE',
  Search = 'FT.SEARCH',
  Add = 'FT.ADD',
  Drop = 'FT.DROP',
  Explain = 'FT.EXPLAIN',
  Del = 'FT.DEL'
}

enum ClientArgs {
  Schema = 'SCHEMA',
  Nooffsets = 'NOOFFSETS',
  Nofields = 'NOFIELDS',
  Stopwords = 'STOPWORDS',
  NoSave = 'NOSAVE',
  Payload = 'PAYLOAD',
  Replace = 'REPLACE',
  Partial = 'PARTIAL',
  Fields = 'FIELDS'
}

/**
 * A client for the RediSearch module.
 * It abstracts the API of the module and lets you just use the engine
 */
export class Client<C extends Redis> {
  private indexName: string;
  private redis: C;

  constructor(indexName: string, conn: C) {
    this.indexName = indexName;
    this.redis = conn;
  }

  /**
   * Create the search index. Creating an existing index juts updates its properties
   * @param fields a list of TextField or NumericField objects
   */
  public createIndex(fields: Field[]): Promise<'OK'> {
    return this.redis.send_command(
      Commands.Create,
      this.indexName,
      ClientArgs.Schema,
      ...fields.map(f => f.redisArgs)
    );
  }

  /**
   * Drop the index if it exists
   */
  public dropIndex(): Promise<'OK'> {
    return this.redis.send_command(Commands.Drop, this.indexName);
  }

  /**
   * Add a single document to the index.
   * @param docId the id of the saved document.
   * @param fields object of the document fields to be saved and/or indexed.
   * NOTE: Geo points shoule be encoded as strings of "lon,lat"
   * @param score the document ranking, between 0.0 and 1.0
   * @param payload optional inner-index payload we can save for fast access in scoring functions
   * @param noSave if set to true, we just index the document, and don't save a copy of it. This means that searches will just return ids.
   * @param replace if true, and the document already is in the index, we perform an update and reindex the document
   * @param partial if true, the fields specified will be added to the existing document.
   * This has the added benefit that any fields specified with `no_index`
   * will not be reindexed again. Implies `replace`
   */
  public addDocument<T extends SchemaDictionary>(
    docId: string,
    fields: T,
    score: DocumentScore = 1.0,
    payload?: Object,
    noSave = false,
    replace = false,
    partial = false
  ): Promise<'OK'> {
    return this._addDocument(
      null,
      docId,
      fields,
      score,
      payload,
      noSave,
      replace,
      partial
    );
  }

  /**
   * Search the index for a given query, and return a result of documents
   * @param queryOrString the search query.
   * Either a text for simple queries
   * with default parameters,
   * or a Query object for complex queries.
   * See RediSearch's documentation on query format
   * @param snippetSizes A dictionary of {field: snippet_size}
   * used to trim and format the result. e.g. {'body': 500}
   */
  public search<T = SchemaDictionary, S = NumericDictionary>(
    queryOrString: Query | string,
    snippetSizes?: S
  ): Promise<Result<T, S>> {
    const query = this.toQuery(queryOrString);

    // Set time
    const hrstart = process.hrtime();

    // Execute the search;
    return this.redis
      .send_command(Commands.Search, this.indexName, ...query.args)
      .then((res: any[]) => {
        const hrend = process.hrtime(hrstart);
        const elapsedMillis = hrend[1] / 1000000;

        return new Result(
          res,
          !query._noContent,
          query.queryString,
          query._withPayloads,
          elapsedMillis,
          snippetSizes
        );
      });
  }

  private _addDocument<T extends SchemaDictionary>(
    conn: Redis | null,
    docId: string,
    fields: T,
    score: DocumentScore = 1.0,
    payload?: Object,
    noSave = false,
    replace = false,
    partial = false
  ): Promise<'OK'> {
    if (partial) {
      replace = true;
    }

    const args = [this.indexName, docId, score];

    if (noSave) {
      args.push(ClientArgs.NoSave);
    }

    // if (R.not(R.isNil(payload))) {
    //   args.push(ClientArgs.Payload, payload);
    // }

    if (replace) {
      args.push(ClientArgs.Replace);
      if (partial) {
        args.push(ClientArgs.Partial);
      }
    }

    args.push(ClientArgs.Fields, ...R.unnest(R.toPairs(fields)));

    return this.redis.send_command(Commands.Add, ...args);
  }

  private toQuery(query: string | Query): Query {
    if (R.is(String, query)) {
      query = new Query(query as string);
    }

    if (R.not(R.is(Query, query))) {
      throw new Error(`Bad query type ${typeof query}`);
    }

    return query;
  }
}
