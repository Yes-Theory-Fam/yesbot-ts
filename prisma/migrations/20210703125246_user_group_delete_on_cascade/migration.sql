-- DropForeignKey
ALTER TABLE "user_group_members_group_member" DROP CONSTRAINT IF EXISTS "user_group_members_group_member_groupMemberId_fkey";

-- AddForeignKey
ALTER TABLE "user_group_members_group_member" ADD FOREIGN KEY ("groupMemberId") REFERENCES "group_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
