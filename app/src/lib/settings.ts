import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function getSetting(key: string, organizationId = DEFAULT_ORG_ID): Promise<string | undefined> {
  const row = await prisma.setting.findUnique({
    where: { organizationId_key: { organizationId, key } },
  });
  return row?.value;
}

export async function setSetting(key: string, value: string, organizationId = DEFAULT_ORG_ID): Promise<void> {
  await prisma.setting.upsert({
    where: { organizationId_key: { organizationId, key } },
    update: { value },
    create: { organizationId, key, value },
  });
}