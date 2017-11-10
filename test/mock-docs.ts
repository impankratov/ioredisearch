import * as faker from 'faker';
import { TextField, NumericField } from '../src/field';

export const titleField = new TextField('title', 5.0, true);
export const commentsField = new NumericField('comments');

export const docId = () => faker.random.alphaNumeric(6);
export const docBody = () => ({
  title: faker.random.words(3),
  comments: faker.random.number()
});
