import { PrismaClient } from "@prisma/client";
import prisma from "./src/prisma.js";
import { mockReset } from "vitest-mock-extended";
import { vi } from "vitest";

vi.mock("./src/prisma.js", async () => {
  const { mockDeep } = await import("vitest-mock-extended");

  return {
    __esModule: true,
    default: mockDeep<PrismaClient>(),
  };
});

beforeEach(() => mockReset(prisma));
