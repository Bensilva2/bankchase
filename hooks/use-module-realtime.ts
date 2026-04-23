'use client';

import { useRealtime } from '@/lib/realtime-orchestrator';
import { useEffect, useState } from 'react';

export function useFinanceRealtime() {
	const { subscribe } = useRealtime();
	const [accounts, setAccounts] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [transfers, setTransfers] = useState([]);

	useEffect(() => {
		const unsubscribeAccounts = subscribe(
			{ schema: 'finance', table: 'accounts', event: '*' },
			(update) => {
				setAccounts((prev) => {
					if (update.event === 'DELETE') {
						return prev.filter((a) => a.id !== update.old.id);
					}
					return prev.map((a) => (a.id === update.new.id ? update.new : a));
				});
			}
		);

		const unsubscribeTransactions = subscribe(
			{ schema: 'finance', table: 'transactions', event: '*' },
			(update) => {
				setTransactions((prev) => [...prev, update.new]);
			}
		);

		const unsubscribeTransfers = subscribe(
			{ schema: 'finance', table: 'transfers', event: '*' },
			(update) => {
				setTransfers((prev) => [...prev, update.new]);
			}
		);

		return () => {
			unsubscribeAccounts();
			unsubscribeTransactions();
			unsubscribeTransfers();
		};
	}, [subscribe]);

	return { accounts, transactions, transfers };
}

export function useHRRealtime() {
	const { subscribe } = useRealtime();
	const [employees, setEmployees] = useState([]);
	const [attendance, setAttendance] = useState([]);
	const [payroll, setPayroll] = useState([]);

	useEffect(() => {
		const unsubscribeEmployees = subscribe(
			{ schema: 'human_resource', table: 'employee', event: '*' },
			(update) => {
				setEmployees((prev) => {
					if (update.event === 'DELETE') {
						return prev.filter((e) => e.id !== update.old.id);
					}
					return prev.map((e) => (e.id === update.new.id ? update.new : e));
				});
			}
		);

		const unsubscribeAttendance = subscribe(
			{ schema: 'human_resource', table: 'attendance', event: '*' },
			(update) => {
				setAttendance((prev) => [...prev, update.new]);
			}
		);

		const unsubscribePayroll = subscribe(
			{ schema: 'human_resource', table: 'payroll', event: '*' },
			(update) => {
				setPayroll((prev) => [...prev, update.new]);
			}
		);

		return () => {
			unsubscribeEmployees();
			unsubscribeAttendance();
			unsubscribePayroll();
		};
	}, [subscribe]);

	return { employees, attendance, payroll };
}

export function useInventoryRealtime() {
	const { subscribe } = useRealtime();
	const [products, setProducts] = useState([]);
	const [stock, setStock] = useState([]);
	const [orders, setOrders] = useState([]);

	useEffect(() => {
		const unsubscribeProducts = subscribe(
			{ schema: 'inventory', table: 'products', event: '*' },
			(update) => {
				setProducts((prev) => {
					if (update.event === 'DELETE') {
						return prev.filter((p) => p.id !== update.old.id);
					}
					return prev.map((p) => (p.id === update.new.id ? update.new : p));
				});
			}
		);

		const unsubscribeStock = subscribe(
			{ schema: 'inventory', table: 'stock_transactions', event: '*' },
			(update) => {
				setStock((prev) => [...prev, update.new]);
			}
		);

		const unsubscribeOrders = subscribe(
			{ schema: 'inventory', table: 'purchase_orders', event: '*' },
			(update) => {
				setOrders((prev) => [...prev, update.new]);
			}
		);

		return () => {
			unsubscribeProducts();
			unsubscribeStock();
			unsubscribeOrders();
		};
	}, [subscribe]);

	return { products, stock, orders };
}

export function useSecurityRealtime() {
	const { subscribe } = useRealtime();
	const [auditLogs, setAuditLogs] = useState([]);
	const [activeSessions, setActiveSessions] = useState([]);
	const [users, setUsers] = useState([]);

	useEffect(() => {
		const unsubscribeAuditLogs = subscribe(
			{ schema: 'security', table: 'audit_logs', event: '*' },
			(update) => {
				setAuditLogs((prev) => [...prev, update.new]);
			}
		);

		const unsubscribeSessions = subscribe(
			{ schema: 'security', table: 'sessions', event: '*' },
			(update) => {
				setActiveSessions((prev) => {
					if (update.event === 'DELETE') {
						return prev.filter((s) => s.id !== update.old.id);
					}
					return prev.map((s) => (s.id === update.new.id ? update.new : s));
				});
			}
		);

		const unsubscribeUsers = subscribe(
			{ schema: 'security', table: 'users', event: '*' },
			(update) => {
				setUsers((prev) => {
					if (update.event === 'DELETE') {
						return prev.filter((u) => u.id !== update.old.id);
					}
					return prev.map((u) => (u.id === update.new.id ? update.new : u));
				});
			}
		);

		return () => {
			unsubscribeAuditLogs();
			unsubscribeSessions();
			unsubscribeUsers();
		};
	}, [subscribe]);

	return { auditLogs, activeSessions, users };
}
