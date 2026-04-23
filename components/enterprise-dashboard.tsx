'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Briefcase,
  Package,
  Lock,
  BarChart3,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useHRModule, useInventoryModule, useSecurityModule } from '@/hooks/use-enterprise-modules';

export function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState('finance');
  const [searchTerm, setSearchTerm] = useState('');

  // Load all modules with real-time updates
  const { employees, departments, attendance, payroll, loading: hrLoading } = useHRModule();
  const { products, suppliers, loading: invLoading } = useInventoryModule();
  const { auditLogs, users, roles, loading: secLoading } = useSecurityModule();

  // Calculate HR metrics
  const activeEmployees = employees.filter((e: any) => e.status === 'active').length;
  const departmentCount = departments.length;

  // Calculate inventory metrics
  const lowStockProducts = products.filter((p: any) => p.quantity_in_stock <= p.reorder_level).length;
  const totalInventoryValue = products.reduce((sum: number, p: any) => sum + (p.unit_price * p.quantity_in_stock), 0);

  // Calculate security metrics
  const suspendedUsers = users.filter((u: any) => u.status === 'suspended').length;
  const recentAudits = auditLogs.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Enterprise Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time monitoring across all departments</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button>Export Report</Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees}</div>
              <p className="text-xs text-gray-600">in {departmentCount} departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalInventoryValue / 1000).toFixed(1)}K</div>
              <p className="text-xs text-gray-600">{products.length} products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts}</div>
              <p className="text-xs text-gray-600">require reordering</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Lock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suspendedUsers === 0 ? 'Secure' : 'Alert'}
              </div>
              <p className="text-xs text-gray-600">
                {suspendedUsers} suspended accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="finance" className="flex gap-2">
              <BarChart3 className="h-4 w-4" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="hr" className="flex gap-2">
              <Users className="h-4 w-4" />
              HR
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="security" className="flex gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Real-time financial metrics and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-blue-600">1,234</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Daily Revenue</p>
                    <p className="text-2xl font-bold text-green-600">$45,230</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending Transfers</p>
                    <p className="text-2xl font-bold text-purple-600">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HR Tab */}
          <TabsContent value="hr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Human Resources</CardTitle>
                <CardDescription>Employee management and attendance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {hrLoading ? (
                  <p>Loading HR data...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Employees</p>
                        <p className="text-2xl font-bold">{employees.length}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Present Today</p>
                        <p className="text-2xl font-bold">
                          {attendance.filter((a: any) => a.status === 'present').length}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Recent Attendance</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {attendance.slice(0, 5).map((record: any) => (
                          <div key={record.id} className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{record.employee?.first_name}</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {record.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Product stock and supplier information</CardDescription>
              </CardHeader>
              <CardContent>
                {invLoading ? (
                  <p>Loading inventory data...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold">{products.length}</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Low Stock Alert</p>
                        <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Critical Inventory Items</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {products
                          .filter((p: any) => p.quantity_in_stock <= p.reorder_level)
                          .slice(0, 5)
                          .map((product: any) => (
                            <div key={product.id} className="flex justify-between p-2 bg-orange-50 rounded">
                              <span className="text-sm font-medium">{product.name}</span>
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Stock: {product.quantity_in_stock}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security & Access Control</CardTitle>
                <CardDescription>System audit logs and user activity</CardDescription>
              </CardHeader>
              <CardContent>
                {secLoading ? (
                  <p>Loading security data...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Suspended Users</p>
                        <p className="text-2xl font-bold text-red-600">{suspendedUsers}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Recent Audit Activities</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recentAudits.map((log: any) => (
                          <div key={log.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                            <div>
                              <p className="font-medium">{log.action}</p>
                              <p className="text-gray-600">{log.resource_type}</p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded ${
                                log.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
