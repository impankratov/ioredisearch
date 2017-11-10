import { docId, docBody, titleField, commentsField } from './mock-docs';
import { Redis as RedisInstance } from 'ioredis';

import { BatchIndexer } from '../src/batch-indexer';
import { Client } from '../src/redisearch-node';

const Redis = require('ioredis');
const redis: RedisInstance = new Redis();

describe('BatchIndexer', () => {
  afterEach(() => {
    return redis.flushall();
  });

  it('should instantiate with Client instance and store the Redis pipeline', () => {
    const pipelineSpy = jest.spyOn(redis, 'pipeline');
    const client = new Client('test', redis);
    const batcher = new BatchIndexer(client);

    expect(batcher).toBeInstanceOf(BatchIndexer);
    expect(pipelineSpy).toBeCalled();
  });

  describe('addDocuments', () => {
    it('should return the promise of batch result', () => {
      const client = new Client('test', redis);

      return client.createIndex([titleField, commentsField]).then(() => {
        const batcher = new BatchIndexer(client, 3);
        const commitSpy = jest.spyOn(batcher, 'commit' as any);

        return batcher
          .addDocuments([
            { docId: docId(), fields: docBody() },
            { docId: docId(), fields: docBody() },
            { docId: docId(), fields: docBody() }
          ])
          .then(res => {
            expect(res).toEqual('OK');
            expect(commitSpy).toBeCalled();
          });
      });
    });
  });
});
