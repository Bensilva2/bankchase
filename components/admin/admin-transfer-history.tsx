/**
 * Admin Transfer History - Display transfer records with status
 */

'use client'

interface Transfer {
  id: string
  user_id: string
  account_id: string
  amount: number
  status: string
  created_at: string
  confirmed_at?: string
  users?: { id: string; email: string; name: string }
  accounts?: { id: string; name: string; account_type: string; account_number: string; balance: number }
}

interface AdminTransferHistoryProps {
  transfers: Transfer[]
}

export default function AdminTransferHistory({ transfers }: AdminTransferHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending_otp':
        return 'bg-yellow-100 text-yellow-700'
      case 'pending':
        return 'bg-blue-100 text-blue-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_otp':
        return 'Awaiting OTP'
      case 'completed':
        return 'Completed'
      case 'pending':
        return 'Pending'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No transfers found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Recipient
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Account
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Date
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Confirmed
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transfers.map((transfer) => (
            <tr key={transfer.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {transfer.users?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">{transfer.users?.email}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {transfer.accounts?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">{transfer.accounts?.account_type}</p>
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="font-semibold text-green-600">${transfer.amount.toFixed(2)}</span>
              </td>
              <td className="px-4 py-4">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    transfer.status
                  )}`}
                >
                  {getStatusLabel(transfer.status)}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {formatDate(transfer.created_at)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {transfer.confirmed_at ? formatDate(transfer.confirmed_at) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
