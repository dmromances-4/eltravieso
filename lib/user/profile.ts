import type { User } from "@prisma/client";

export type UserProfilePayload = {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  birthDate: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  role: string;
  isTwoFactorEnabled: boolean;
  hasTwoFactorSecret: boolean;
  createdAt: string;
  updatedAt: string;
};

export function formatBirthDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export function parseBirthDateInput(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const parsed = new Date(`${raw}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de cumpleaños inválida.");
  }
  return parsed;
}

export function serializeUserProfile(
  user: Pick<
    User,
    | "id"
    | "name"
    | "email"
    | "imageUrl"
    | "birthDate"
    | "address"
    | "city"
    | "postalCode"
    | "country"
    | "role"
    | "isTwoFactorEnabled"
    | "twoFactorSecret"
    | "createdAt"
    | "updatedAt"
  >,
): UserProfilePayload {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    imageUrl: user.imageUrl,
    birthDate: formatBirthDate(user.birthDate),
    address: user.address,
    city: user.city,
    postalCode: user.postalCode,
    country: user.country,
    role: user.role,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    hasTwoFactorSecret: Boolean(user.twoFactorSecret),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  imageUrl: true,
  birthDate: true,
  address: true,
  city: true,
  postalCode: true,
  country: true,
  role: true,
  isTwoFactorEnabled: true,
  twoFactorSecret: true,
  stripeCustomerId: true,
  membershipStatus: true,
  membershipExpiresAt: true,
  password: true,
  createdAt: true,
  updatedAt: true,
} as const;
