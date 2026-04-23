'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useFinanceRealtime, useHRRealtime, useInventoryRealtime, useSecurityRealtime } from '@/hooks/use-module-realtime';

export function RealTimeMonitorDashboard() {
	const financeData = useFinanceRealtime();
	const hrData = useHRRealtime();
	const inventoryData = useInventoryRealtime();
	const securityData = useSecurityRealtime();

	return (
		<div className="w-full max-w-7xl mx-auto p-6 bg-background">
			<div className="mb-8">
				<h1 className="text-4xl font-bold text-foreground mb-2">
					Enterprise Real-Time Dashboard
				</h1>
				<p className="text-muted-foreground">
					Live updates across all modules - Finance, HR, Inventory & Security
				</p>
			</div>

			<Tabs defaultValue="finance" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="finance">Finance</TabsTrigger>
					<TabsTrigger value="hr">HR</TabsTrigger>
					<TabsTrigger value="inventory">Inventory</TabsTrigger>
					<TabsTrigger value="security">Security</TabsTrigger>
				</TabsList>

				<TabsContent value="finance" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{financeData.accounts.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Real-time account count
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Transactions</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{financeData.transactions.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Live transactions
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Transfers</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{financeData.transfers.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Processed transfers
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Recent Transactions</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{financeData.transactions.slice(-5).map((tx, i) => (
									<div
										key={i}
										className="flex justify-between items-center p-2 bg-muted rounded"
									>
										<span className="text-sm font-medium">Transaction {i + 1}</span>
										<Badge variant="outline">
											{tx.transaction_type || 'N/A'}
										</Badge>
									</div>
								))}
								{financeData.transactions.length === 0 && (
									<p className="text-sm text-muted-foreground">
										No transactions yet
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="hr" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Employees</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{hrData.employees.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Active employees
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Attendance</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{hrData.attendance.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Records logged
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Payroll</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{hrData.payroll.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Payroll entries
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Employee Updates</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{hrData.employees.slice(-5).map((emp, i) => (
									<div
										key={i}
										className="flex justify-between items-center p-2 bg-muted rounded"
									>
										<span className="text-sm font-medium">
											{emp.first_name} {emp.last_name}
										</span>
										<Badge variant="secondary">
											{emp.job_title || 'Staff'}
										</Badge>
									</div>
								))}
								{hrData.employees.length === 0 && (
									<p className="text-sm text-muted-foreground">
										No employees yet
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="inventory" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Products</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{inventoryData.products.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									In catalog
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Stock Moves</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{inventoryData.stock.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Transactions
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Orders</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{inventoryData.orders.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Purchase orders
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Product Updates</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{inventoryData.products.slice(-5).map((prod, i) => (
									<div
										key={i}
										className="flex justify-between items-center p-2 bg-muted rounded"
									>
										<span className="text-sm font-medium">
											{prod.product_name || `Product ${i + 1}`}
										</span>
										<Badge variant="secondary">
											SKU: {prod.sku || 'N/A'}
										</Badge>
									</div>
								))}
								{inventoryData.products.length === 0 && (
									<p className="text-sm text-muted-foreground">
										No products yet
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="security" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Active Users</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{securityData.users.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									System users
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Sessions</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{securityData.activeSessions.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Active sessions
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{securityData.auditLogs.length}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Events logged
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Recent Audit Events</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{securityData.auditLogs.slice(-5).map((log, i) => (
									<div
										key={i}
										className="flex justify-between items-center p-2 bg-muted rounded"
									>
										<span className="text-sm font-medium">
											{log.action || 'Action'} by {log.user_id || 'System'}
										</span>
										<Badge variant="outline">
											{new Date(log.timestamp).toLocaleTimeString()}
										</Badge>
									</div>
								))}
								{securityData.auditLogs.length === 0 && (
									<p className="text-sm text-muted-foreground">
										No audit logs yet
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
