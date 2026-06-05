'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartItem = {
  id: string
  name: string
  description: string
  amount: number // unit price in cents
  quantity: number
  image?: string
}

type CartContextValue = {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clear: () => void
  count: number
  subtotalCents: number
}

const STORAGE_KEY = 'vermut-cart'

const CartContext = createContext<CartContextValue | null>(null)

function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is CartItem =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        typeof entry.amount === 'number' &&
        typeof entry.quantity === 'number',
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydration-safe: only read localStorage on the client after mount.
  useEffect(() => {
    setItems(readStoredCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore quota / serialization errors — cart stays in memory.
    }
  }, [items, hydrated])

  const addToCart = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id)
      const addQty = item.quantity > 0 ? item.quantity : 1
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: entry.quantity + addQty }
            : entry,
        )
      }
      return [...prev, { ...item, quantity: addQty }]
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) {
        return prev.filter((entry) => entry.id !== id)
      }
      return prev.map((entry) =>
        entry.id === id ? { ...entry, quantity: qty } : entry,
      )
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.amount * item.quantity, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQty,
      clear,
      count,
      subtotalCents,
    }),
    [items, addToCart, removeFromCart, updateQty, clear, count, subtotalCents],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider')
  }
  return context
}
