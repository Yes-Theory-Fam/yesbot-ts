import { mockDeep, mockReset } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import prisma from "./src/prisma";

jest.mock("./src/prisma", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => mockReset(prisma));
