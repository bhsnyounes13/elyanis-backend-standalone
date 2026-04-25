import type { Role } from "@prisma/client";
import { prisma } from "../prisma.js";

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(email: string, passwordHash: string, role: Role) {
  return prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    },
  });
}

const userPublicSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsersForAdmin(take = 100) {
  const n = Math.min(Math.max(take, 1), 200);
  return prisma.user.findMany({
    select: userPublicSelect,
    orderBy: { createdAt: "desc" },
    take: n,
  });
}

export async function countUsersWithRole(role: Role): Promise<number> {
  return prisma.user.count({ where: { role } });
}

export async function updateUserRole(userId: string, role: Role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: userPublicSelect,
  });
}

export async function deleteUserCascade(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
