import React from 'react'
import { AlertCircle } from 'lucide-react'
import { TradeStatus } from './types'

const formatErrorMessage = (error: Error) => {
  const message = error.message
  if (message.includes('reverted')) {
    const reasonMatch = message.match(/reason: (.*?)(?=\n|Contract Call|$)/)
    return reasonMatch ? reasonMatch[1].trim() : message
  }
  return message
}

const StatusMessage: React.FC<{ status: TradeStatus }> = ({ status }) => {
  if (status.type === 'idle') return null

  if (status.type === 'pending') {
    return (
      <div className="rounded-lg border border-blue-200 p-4 text-sm text-gray-500">
        {status.message}
      </div>
    )
  }

  if (status.type === 'success') {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-600">
        {status.message}
      </div>
    )
  }

  if (status.type === 'error' && status.error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm space-y-2">
        <div className="flex items-start space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="font-medium">Transaction Failed</div>
        </div>
        <div className="text-red-600 pl-7 break-all">
          {formatErrorMessage(status.error)}
        </div>
        {status.error.message.includes('Docs:') && (
          <div className="text-red-500 pl-7 text-xs">
            <a 
              href={status.error.message.split('Docs: ')[1].split('\n')[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              View Documentation ↗
            </a>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default StatusMessage