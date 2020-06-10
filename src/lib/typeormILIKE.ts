// Support for postgres ILIKE
// Shamelessly copied from https://github.com/typeorm/typeorm/issues/4418#issuecomment-562951778
// Might be included in upstream in future release: https://github.com/typeorm/typeorm/pull/5828

import { Connection, FindOperator, FindOperatorType } from "typeorm";

class FindOperatorWithExtras<T> extends FindOperator<T> {
  constructor(
    type: FindOperatorType | "ilike",
    value: FindOperator<T> | T,
    useParameter?: boolean,
    multipleParameters?: boolean
  ) {
    // @ts-ignore
    super(type, value, useParameter, multipleParameters);
  }

  public toSql(
    connection: Connection,
    aliasPath: string,
    parameters: string[]
  ): string {
    // @ts-ignore
    if (this._type === "ilike") {
      return `${aliasPath} ILIKE ${parameters[0]}`;
    }

    return super.toSql(connection, aliasPath, parameters);
  }
}

/**
 * Find Options Operator.
 * Example: { someField: Like("%some sting%") }
 */
export function ILike<T>(
  value: T | FindOperator<T>
): FindOperatorWithExtras<T> {
  return new FindOperatorWithExtras("ilike", value);
}
