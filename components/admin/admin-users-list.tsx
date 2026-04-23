/**
 * Admin Users List - Display new users with their account information
 */

'use client'

interface User {
  id: string
  email: string
  name: string
  created_at: string
  accounts: any[]
}

interface AdminUsersListProps {
  users: User[]
}

export default function AdminUsersList({ users }: AdminUsersListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No registered users found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              User
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Email
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Accounts
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Registered
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {user.accounts?.map((account: any) => (
                    <span
                      key={account.id}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium"
                    >
                      {account.account_type || account.name} - ${parseFloat(account.balance || 0).toFixed(2)}
                    </span>
                  ))}
                  {(!user.accounts || user.accounts.length === 0) && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      No accounts
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatDate(user.created_at)}</td>
              <td className="px-4 py-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Active
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
