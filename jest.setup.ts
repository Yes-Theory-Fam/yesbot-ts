import { mockDeep, mockReset } from "jest-mock-extended";
import { PrismaClient } from "@yes-theory-fam/database/client";
import prisma from "./src/prisma";

jest.mock("./src/prisma", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => mockReset(prisma));
