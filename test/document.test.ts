import { Document } from '../src/document';
import * as faker from 'faker';

describe('Document', () => {
  it('should instantiate', () => {
    const id = faker.random.alphaNumeric(3);

    const title = faker.random.words(4);
    const description = faker.random.words(10);
    const comments = faker.random.number();

    const doc = new Document(id, {
      title,
      description,
      comments
    });

    expect(doc).toBeInstanceOf(Document);
    expect(doc.id).toEqual(id);
    expect(doc).toMatchObject({
      title,
      description,
      comments
    });
  });
});
