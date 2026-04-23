'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useHRModule() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all HR data
  const fetchHRData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, deptRes, attRes, payRes] = await Promise.all([
        fetch('/api/hr/employees'),
        fetch('/api/hr/departments'),
        fetch('/api/hr/attendance'),
        fetch('/api/hr/payroll')
      ]);

      const [empData, deptData, attData, payData] = await Promise.all([
        empRes.json(),
        deptRes.json(),
        attRes.json(),
        payRes.json()
      ]);

      setEmployees(empData);
      setDepartments(deptData);
      setAttendance(attData);
      setPayroll(payData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch HR data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchHRData();

    const subscription = supabase
      .channel('hr_updates')
      .on('postgres_changes', { event: '*', schema: 'human_resource' }, () => {
        fetchHRData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchHRData]);

  return { employees, departments, attendance, payroll, loading, error, refetch: fetchHRData };
}

export function useInventoryModule() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, supRes] = await Promise.all([
        fetch('/api/inventory/products'),
        fetch('/api/inventory/categories'),
        fetch('/api/inventory/suppliers')
      ]);

      const [prodData, catData, supData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        supRes.json()
      ]);

      setProducts(prodData);
      setCategories(catData);
      setSuppliers(supData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();

    const subscription = supabase
      .channel('inventory_updates')
      .on('postgres_changes', { event: '*', schema: 'inventory' }, () => {
        fetchInventoryData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchInventoryData]);

  return { products, categories, suppliers, loading, error, refetch: fetchInventoryData };
}

export function useSecurityModule() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      const [auditRes, userRes, roleRes] = await Promise.all([
        fetch('/api/security/audit'),
        fetch('/api/security/users'),
        fetch('/api/security/roles')
      ]);

      const [auditData, userData, roleData] = await Promise.all([
        auditRes.json(),
        userRes.json(),
        roleRes.json()
      ]);

      setAuditLogs(auditData);
      setUsers(userData);
      setRoles(roleData);
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();

    const subscription = supabase
      .channel('security_updates')
      .on('postgres_changes', { event: '*', schema: 'security' }, () => {
        fetchSecurityData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSecurityData]);

  return { auditLogs, users, roles, loading, refetch: fetchSecurityData };
}
