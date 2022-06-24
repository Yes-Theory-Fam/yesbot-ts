const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

const seed = async () => {
  await prisma.release.upsert({
    where: {id: "7e40878f-7396-4c3e-a14c-f05c8da5e344"},
    update: {},
    create: {
      id: "7e40878f-7396-4c3e-a14c-f05c8da5e344",
      releaseName: "do auto migrate in start",
      releaseTag: "0.0.4",
      releaseTime: "2021-07-02T13:29:57Z"
    },
  });
};

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => await prisma.$disconnect());
