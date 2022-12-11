import prisma from '../../prisma';

export class GroupService {
  public async getGroupById(id: number) {
    return await prisma.userGroup.findUnique({ where: { id } });
  }
}
