import { EntityManager, EntityName, EntityRepository, QueryBuilder } from "@mikro-orm/postgresql";

export class CustomSQLBaseRepository<Entity extends object> extends EntityRepository<Entity> {
  constructor(protected readonly em: EntityManager, entityName: EntityName<Entity>) {
    super(em, entityName);
  }

  protected retrievePaginatedRecordsByLimitAndOffset({
    qb,
    page = 1,
    limit = 10,
  }: {
    qb: QueryBuilder<Entity>;
    page?: number;
    limit?: number;
  }) {
    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 1 : limit;

    qb.limit(limit).offset((page - 1) * limit);

    return qb.getResultAndCount();
  }
}
