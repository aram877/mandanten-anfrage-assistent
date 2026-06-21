import { Query, QueryType } from '@domain/queries';

export type QueryHandler<Q extends Query, R> = (query: Q) => Promise<R>;

export class QueryBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<QueryType, QueryHandler<any, any>>();

  register<Q extends Query, R>(type: QueryType, handler: QueryHandler<Q, R>): void {
    this.handlers.set(type, handler);
  }

  async dispatch<Q extends Query, R>(query: Q): Promise<R> {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`No handler registered for query type: ${query.type}`);
    }
    return handler(query);
  }
}
