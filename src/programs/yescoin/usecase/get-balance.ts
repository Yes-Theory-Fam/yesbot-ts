import prisma from "../../../prisma";
import { createYesBotLogger } from "../../../log";

export class GetBalance {
  private static getBalanceInstance: GetBalance;

  private constructor() {}

  public async handle(userId: string) {
    return await prisma.currency
      .findUnique({
        select: {
          ammount: true,
        },
        where: {
          userId,
        },
      })
      .then((result) => result.ammount)
      .catch(() => 0);
  }

  public static instance() {
    if (!GetBalance.getBalanceInstance) {
      GetBalance.getBalanceInstance = new GetBalance();
    }
    return GetBalance.getBalanceInstance;
  }
}
