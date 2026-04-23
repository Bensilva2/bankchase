'use client';

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	ReactNode,
	useRef,
} from 'react';
import { createClient as createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface RealtimeSubscription {
	schema: string;
	table: string;
	event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

interface RealtimeUpdate {
	schema: string;
	table: string;
	event: 'INSERT' | 'UPDATE' | 'DELETE';
	new: Record<string, any>;
	old: Record<string, any>;
	timestamp: string;
}

interface RealtimeContextType {
	subscribe: (
		subscription: RealtimeSubscription,
		callback: (update: RealtimeUpdate) => void
	) => () => void;
	isConnected: boolean;
	lastUpdate: RealtimeUpdate | null;
	financeTables: Set<string>;
	hrTables: Set<string>;
	inventoryTables: Set<string>;
	securityTables: Set<string>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
	undefined
);

export function RealtimeProvider({ children }: { children: ReactNode }) {
	const [isConnected, setIsConnected] = useState(false);
	const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
	const subscriptionsRef = useRef<Map<string, Set<(update: RealtimeUpdate) => void>>>(
		new Map()
	);

	// Define table groups for each module
	const financeTables = new Set(['customers', 'accounts', 'transactions', 'transfers', 'bills']);
	const hrTables = new Set(['departments', 'employee', 'attendance', 'payroll', 'leave_requests']);
	const inventoryTables = new Set(['categories', 'products', 'suppliers', 'stock_transactions', 'purchase_orders']);
	const securityTables = new Set(['users', 'roles', 'permissions', 'audit_logs', 'sessions']);

	// Use the singleton client from lib/supabase/client (may be null if not configured)
	const supabaseRef = useRef<ReturnType<typeof createSupabaseClient> | null>(null);
	const supabaseInitialized = useRef(false);
	
	// Initialize client only once
	if (!supabaseInitialized.current) {
		supabaseInitialized.current = true;
		if (isSupabaseConfigured()) {
			supabaseRef.current = createSupabaseClient();
		}
	}
	
	const supabase = supabaseRef.current;

	// Subscribe to real-time changes
	const subscribe = useCallback(
		(
			subscription: RealtimeSubscription,
			callback: (update: RealtimeUpdate) => void
		) => {
			if (!supabase || !isSupabaseConfigured()) return () => {};

			const key = `${subscription.schema}.${subscription.table}`;
			const subscriptions = subscriptionsRef.current;

			if (!subscriptions.has(key)) {
				subscriptions.set(key, new Set());

				// Create Supabase realtime subscription
				const channel = supabase
					.channel(`${key}-changes`)
					.on(
						'postgres_changes',
						{
							event: subscription.event,
							schema: subscription.schema,
							table: subscription.table,
						},
						(payload) => {
							const update: RealtimeUpdate = {
								schema: subscription.schema,
								table: subscription.table,
								event: payload.eventType,
								new: payload.new || {},
								old: payload.old || {},
								timestamp: new Date().toISOString(),
							};

							setLastUpdate(update);

							// Broadcast to all listeners
							const listeners = subscriptions.get(key);
							if (listeners) {
								listeners.forEach((listener) => listener(update));
							}
						}
					)
					.subscribe();

				setIsConnected(true);
			}

			const listeners = subscriptions.get(key);
			if (listeners) {
				listeners.add(callback);
			}

			return () => {
				const listeners = subscriptionsRef.current.get(key);
				if (listeners) {
					listeners.delete(callback);
				}
			};
		},
		[supabase]
	);

	useEffect(() => {
		// Auto-subscribe to all module tables on mount
		const allTables = [
			...Array.from(financeTables),
			...Array.from(hrTables),
			...Array.from(inventoryTables),
			...Array.from(securityTables),
		];

		const unsubscribes = allTables.map((table) => {
			let schema = 'public';
			if (financeTables.has(table)) schema = 'finance';
			else if (hrTables.has(table)) schema = 'human_resource';
			else if (inventoryTables.has(table)) schema = 'inventory';
			else if (securityTables.has(table)) schema = 'security';

			return subscribe({ schema, table, event: '*' }, () => {});
		});

		return () => {
			unsubscribes.forEach((unsub) => unsub());
		};
	}, [subscribe]);

	return (
		<RealtimeContext.Provider
			value={{
				subscribe,
				isConnected,
				lastUpdate,
				financeTables,
				hrTables,
				inventoryTables,
				securityTables,
			}}
		>
			{children}
		</RealtimeContext.Provider>
	);
}

export function useRealtime() {
	const context = useContext(RealtimeContext);
	if (!context) {
		throw new Error('useRealtime must be used within RealtimeProvider');
	}
	return context;
}
