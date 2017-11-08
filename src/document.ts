import { SchemaDictionary } from './client';
import * as R from 'ramda';

export class Document {
  public id: string;
  public payload: Object;

  constructor(id: string, fields: Object, payload: Object | null = null) {
    this.id = id;
    this.payload = R.ifElse(R.isNil, R.always({}), R.identity)(payload);

    Object.assign(this, fields);
  }

  /**
   * Create a shortened snippet from the document's content
   * @param field
   * @param size the size of the snippet in characters. It might be a bit longer or shorter
   * @param boldTokens a list of tokens we want to make bold (basically the query terms)
   */
  public snippetize(field: string, size = 500, boldTokens: string[]) {
    const txt: string = R.propOr('', field, this);
    boldTokens.forEach(t => txt.replace(t, `<b>${t}</b>`));

    while (size < txt.length && txt[size] !== ' ') {
      size++;
    }

    Object.assign(this, {
      [field]: txt.length > size ? `${txt.substring(0, size)}...` : txt
    });
  }
}
