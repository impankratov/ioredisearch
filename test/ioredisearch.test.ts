import * as faker from 'faker';
import { Redis } from 'ioredis';

import { NumericField, TextField } from '../src/field';
import { Client } from '../src/client';
import { docId, docBody, titleField, commentsField } from './mock-docs';

const Redis = require('ioredis');
const redis: Redis = new Redis();

interface TestSchema {
  title: string;
  comments: number;
}

describe('Client', () => {
  let client: Client;
  beforeEach(() => {
    client = new Client('test', redis);
  });

  afterEach(() => {
    return redis.flushall();
  });

  it('should instantiate with index name & ioredis client', () => {
    expect(client).toBeInstanceOf(Client);
  });

  it('should be able to instantiated multiple time for the same index', () => {
    const client2 = new Client('test', redis);
    expect(client2).toBeInstanceOf(Client);
  });

  it('should create index', () => {
    return client.createIndex([titleField]).then(res => {
      expect(res).toBe('OK');
    });
  });

  it('should drop index', () => {
    return client
      .createIndex([titleField])
      .then(() => client.dropIndex())
      .then(res => {
        expect(res).toBe('OK');
      });
  });

  describe('addDocument', () => {
    it('should add a document', () => {
      return client
        .createIndex([titleField, commentsField])
        .then(() => client.addDocument<TestSchema>(docId(), docBody()))
        .then(res => {
          expect(res).toBe('OK');
        });
    });

    it(`should add a document with 'noSave' argument`, () => {
      return client
        .createIndex([titleField, commentsField])
        .then(() =>
          client.addDocument<TestSchema>(docId(), docBody(), 0.0, {}, true)
        )
        .then(res => {
          expect(res).toBe('OK');
        });
    });

    it(`should add a document with 'replace' & 'partial' arguments`, () => {
      return client
        .createIndex([titleField, commentsField])
        .then(() =>
          client.addDocument<TestSchema>(
            docId(),
            docBody(),
            0.0,
            {},
            false,
            true,
            true
          )
        )
        .then(res => {
          expect(res).toBe('OK');
        });
    });
  });

  describe('search', () => {
    it('should throw if other than string or Query type is provided', () => {
      return client
        .createIndex([titleField, commentsField])
        .then(() => client.search(666 as any))
        .catch(e => {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(`Bad query type: 'number'`);
        });
    });

    it('should perform a search', () => {
      const requested = {
        id: docId(),
        title: 'testing client search',
        comments: faker.random.number()
      };

      return client
        .createIndex([titleField, commentsField])
        .then(() => client.addDocument<TestSchema>(docId(), docBody()))
        .then(() => client.addDocument<TestSchema>(docId(), docBody()))
        .then(() => client.addDocument<TestSchema>(docId(), docBody()))
        .then(() =>
          client.addDocument<TestSchema>(requested.id, {
            title: requested.title,
            comments: requested.comments
          })
        )
        .then(() => client.search('client search'))
        .then(res => {
          expect(res.total).toBeGreaterThanOrEqual(1);
          expect(res.docs).toContainEqual({
            ...requested,
            payload: {},
            comments: requested.comments.toString()
          });
        });
    });
  });
});
