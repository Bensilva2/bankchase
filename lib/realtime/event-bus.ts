import { EventEmitter } from 'events'

// Single shared event bus for server-side publishing of auth events.
// Note: in multi-instance production, replace with Redis / Supabase / Pusher, etc.
const eventBus = new EventEmitter()
eventBus.setMaxListeners(100)

export default eventBus
