import { prisma } from "../prisma.js";
import { HttpError } from "../errors/http-error.js";

export async function listAgents() {
  return prisma.agent.findMany({ orderBy: { name: "asc" } });
}

export async function getAgentById(id: string) {
  const a = await prisma.agent.findUnique({ where: { id } });
  if (!a) throw new HttpError(404, "Agent not found", { code: "AGENT_NOT_FOUND" });
  return a;
}

export async function createAgent(data: {
  name: string;
  photo: string;
  phone: string;
  email: string;
  bioEn: string;
  bioFr: string;
  bioAr: string;
}) {
  return prisma.agent.create({ data });
}

export async function updateAgent(
  id: string,
  patch: Partial<{
    name: string;
    photo: string;
    phone: string;
    email: string;
    bioEn: string;
    bioFr: string;
    bioAr: string;
  }>,
) {
  await getAgentById(id);
  return prisma.agent.update({ where: { id }, data: patch });
}

export async function deleteAgent(id: string): Promise<void> {
  await getAgentById(id);
  await prisma.agent.delete({ where: { id } });
}
