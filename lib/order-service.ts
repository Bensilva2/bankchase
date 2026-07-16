import { stripe } from '@/lib/stripe-client'

export interface Order {
  id: string
  sessionId: string
  customerId: string | null
  paymentIntentId: string | null
  productId: string
  productType: 'transfer' | 'subscription' | 'bill-pay'
  amount: number // in cents
  status: 'pending' | 'paid' | 'failed'
  createdAt: Date
  updatedAt: Date
}

// In-memory storage for demo (replace with database in production)
const orders = new Map<string, Order>()

export async function createOrder(
  sessionId: string,
  customerId: string | null,
  paymentIntentId: string | null,
  productId: string,
  productType: string,
  amount: number
): Promise<Order> {
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const order: Order = {
    id: orderId,
    sessionId,
    customerId,
    paymentIntentId,
    productId,
    productType: productType as 'transfer' | 'subscription' | 'bill-pay',
    amount,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  orders.set(orderId, order)
  console.log('[v0] Order created:', orderId)

  return order
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'paid' | 'failed'
): Promise<Order | null> {
  const order = orders.get(orderId)
  if (!order) return null

  order.status = status
  order.updatedAt = new Date()
  orders.set(orderId, order)

  console.log('[v0] Order updated:', orderId, 'status:', status)
  return order
}

export async function getOrderBySessionId(sessionId: string): Promise<Order | null> {
  for (const order of orders.values()) {
    if (order.sessionId === sessionId) {
      return order
    }
  }
  return null
}

export async function getOrder(orderId: string): Promise<Order | null> {
  return orders.get(orderId) || null
}

export async function listOrders(
  customerId?: string,
  limit: number = 10
): Promise<Order[]> {
  let result = Array.from(orders.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  if (customerId) {
    result = result.filter((order) => order.customerId === customerId)
  }

  return result.slice(0, limit)
}
