import * as R from 'ramda';

import { Document } from './document';
import { NumericDictionary, SchemaDictionary } from './client';

/**
 * Represents the result of a search query,
 * and has an array of Document objects
 */
export class Result<T = SchemaDictionary, S = NumericDictionary> {
  public total: number;
  public duration: number;
  public docs: (Document & T)[] = [];
  /**
   * @param snippets An optional dictionary of the form {field: snippet_size} for snippet formatting
   */
  constructor(
    res: any[],
    hasContent: boolean,
    query: string,
    hasPayload = false,
    duration = 0,
    snippets?: S
  ) {
    this.total = res[0];
    this.duration = duration;

    const tokens = R.pipe(
      R.trim,
      R.split(' '),
      R.map(R.trim),
      R.reject(R.isEmpty)
    )(query);

    let splitBy = 1;
    if (hasContent) {
      splitBy = hasPayload ? 3 : 2;
    } else {
      hasPayload = false;
    }

    R.pipe<string[], string[], string[][], any>(
      R.drop(1),
      R.splitEvery(splitBy),
      R.map(([id, ...other]) => {
        const payload = hasPayload ? other[0] : null;
        const fieldsOffset = hasPayload ? 1 : 0;

        const fields = R.ifElse(
          R.always(hasContent),
          R.pipe<any[], any, any[], { id?: string }, {}>(
            R.prop(fieldsOffset),
            R.splitEvery(2),
            R.fromPairs,
            R.dissoc('id')
          ),
          R.always({})
        )(other);

        const doc = new Document(id, fields, payload);

        if (hasContent && snippets) {
          R.mapObjIndexed((v, k) => doc.snippetize(k, v, tokens), snippets);
        }

        this.docs.push(doc as any);
      })
    )(res);
  }
}
