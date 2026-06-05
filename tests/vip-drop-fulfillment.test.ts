import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  userHasShippingAddress,
  dropFulfillmentStatusLabel,
  vipDropAutoFulfillEnabled,
} from '@/lib/membership/fulfill-drop'

describe('vip-drop helpers', () => {
  const originalEnv = process.env.VIP_DROP_AUTO_FULFILL

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.VIP_DROP_AUTO_FULFILL
    } else {
      process.env.VIP_DROP_AUTO_FULFILL = originalEnv
    }
  })

  describe('userHasShippingAddress', () => {
    it('returns true when address, city and postalCode are set', () => {
      expect(
        userHasShippingAddress({
          address: 'Calle Mayor 1',
          city: 'Madrid',
          postalCode: '28001',
        })
      ).toBe(true)
    })

    it('returns false when any required field is missing', () => {
      expect(
        userHasShippingAddress({
          address: 'Calle Mayor 1',
          city: null,
          postalCode: '28001',
        })
      ).toBe(false)
    })

    it('returns false for whitespace-only values', () => {
      expect(
        userHasShippingAddress({
          address: '   ',
          city: 'Madrid',
          postalCode: '28001',
        })
      ).toBe(false)
    })
  })

  describe('dropFulfillmentStatusLabel', () => {
    it('maps known statuses to Spanish labels', () => {
      expect(dropFulfillmentStatusLabel('PENDING_PRODUCT')).toContain('configurar')
      expect(dropFulfillmentStatusLabel('PENDING_ADDRESS')).toContain('dirección')
      expect(dropFulfillmentStatusLabel('ORDER_CREATED')).toContain('preparación')
      expect(dropFulfillmentStatusLabel('FULFILLED')).toBe('Enviado')
    })
  })

  describe('vipDropAutoFulfillEnabled', () => {
    beforeEach(() => {
      delete process.env.VIP_DROP_AUTO_FULFILL
    })

    it('defaults to true when env is unset', () => {
      expect(vipDropAutoFulfillEnabled()).toBe(true)
    })

    it('respects VIP_DROP_AUTO_FULFILL=false', () => {
      process.env.VIP_DROP_AUTO_FULFILL = 'false'
      expect(vipDropAutoFulfillEnabled()).toBe(false)
    })

    it('accepts VIP_DROP_AUTO_FULFILL=1', () => {
      process.env.VIP_DROP_AUTO_FULFILL = '1'
      expect(vipDropAutoFulfillEnabled()).toBe(true)
    })
  })
})
