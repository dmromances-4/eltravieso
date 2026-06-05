import type { MembershipStatus, User } from '@prisma/client'

export function isActiveVip(user: Pick<User, 'membershipStatus' | 'membershipExpiresAt'>): boolean {
  if (user.membershipStatus !== 'ACTIVE') return false
  if (user.membershipExpiresAt && user.membershipExpiresAt < new Date()) return false
  return true
}

export function vipMaxRoomUsers(): number {
  const n = parseInt(process.env.VIP_MAX_ROOM_USERS ?? '50', 10)
  return Number.isFinite(n) && n > 0 ? n : 50
}

export function freeMaxRoomUsers(): number {
  const n = parseInt(process.env.FREE_MAX_ROOM_USERS ?? '10', 10)
  return Number.isFinite(n) && n > 0 ? n : 10
}

export { dropFulfillmentStatusLabel, vipDropAutoFulfillEnabled, userHasShippingAddress } from './fulfill-drop'

export function membershipStatusLabel(status: MembershipStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Activa'
    case 'PAST_DUE':
      return 'Pago pendiente'
    case 'CANCELLED':
      return 'Cancelada'
    default:
      return 'Sin membresía'
  }
}
