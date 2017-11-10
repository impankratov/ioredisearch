import { Client } from './client';
import { DocumentScore, SchemaDictionary } from './ioredisearch';
import { Pipeline, Redis } from 'ioredis';
import * as R from 'ramda';

/**
 * Helper document interface for batch operations
 */
export interface BatchDoc<T extends SchemaDictionary> {
  docId: string;
  fields: T;
  score?: DocumentScore;
  payload?: Object;
}

/**
 * A batch indexer allows you to automatically batch
 * document indexing in pipelines, flushing it every N documents.
 */
export class BatchIndexer {
  private client: Client;
  private pipeline: Redis;
  private chunkSize: number;

  constructor(client: Client, chunkSize = 1000) {
    this.client = client;
    this.pipeline = (client.redis.pipeline() as any) as Redis;
    this.chunkSize = chunkSize;
  }

  /**
   * Add multiple documents via Redis pipelining
   * @param docs array of objects containing document related properties
   * (score defaults to 1.0 if omitted)
   */
  public addDocuments<T extends SchemaDictionary>(
    docs: BatchDoc<T>[],
    noSave = false,
    replace = false,
    partial = false
  ): Promise<'OK'> {
    return R.pipe<
      BatchDoc<T>[],
      BatchDoc<T>[][],
      Promise<any>[],
      Promise<any[]>
    >(
      R.splitEvery(this.chunkSize),
      R.map(group => {
        R.map(this.partialAddDoc<T>(noSave, replace, partial))(group);
        return this.commit();
      }),
      Promise.all.bind(Promise)
    )(docs).then(() => 'OK' as 'OK');
  }

  private partialAddDoc<T>(
    noSave: boolean,
    replace: boolean,
    partial: boolean
  ) {
    return ({ docId, fields, score = 1.0, payload }: BatchDoc<T>) =>
      this.client._addDocument(
        this.pipeline,
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
   * Manually commit and flush the batch indexing query
   */
  private commit(): Promise<any> {
    return this.pipeline.exec();
  }
}
