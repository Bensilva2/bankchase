'use client';

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	ReactNode,
} from 'react';
import { createClient } from '@supabase/supabase-js';

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
	const subscriptions = new Map<
		string,
		Set<(update: RealtimeUpdate) => void>
	>();

	// Define table groups for each module
	const financeTables = new Set(['customers', 'accounts', 'transactions', 'transfers', 'bills']);
	const hrTables = new Set(['departments', 'employee', 'attendance', 'payroll', 'leave_requests']);
	const inventoryTables = new Set(['categories', 'products', 'suppliers', 'stock_transactions', 'purchase_orders']);
	const securityTables = new Set(['users', 'roles', 'permissions', 'audit_logs', 'sessions']);

	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	);

	// Subscribe to real-time changes
	const subscribe = useCallback(
		(
			subscription: RealtimeSubscription,
			callback: (update: RealtimeUpdate) => void
		) => {
			const key = `${subscription.schema}.${subscription.table}`;

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
					.subscribe((status) => {
						if (status === 'SUBSCRIBED') {
							setIsConnected(true);
						} else if (status === 'CHANNEL_ERROR') {
							setIsConnected(false);
						}
					});
			}

			// Add callback to listeners
			const listeners = subscriptions.get(key)!;
			listeners.add(callback);

			// Return unsubscribe function
			return () => {
				listeners.delete(callback);
				if (listeners.size === 0) {
					subscriptions.delete(key);
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
