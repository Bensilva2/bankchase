import { auth } from '@/lib/auth'

export async function GET() {
  return Response.json({ message: 'Auth endpoint ready' })
}

export async function POST() {
  return Response.json({ message: 'Auth ready' })
}
