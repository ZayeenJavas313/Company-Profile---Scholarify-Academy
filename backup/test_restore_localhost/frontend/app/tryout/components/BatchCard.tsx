'use client'
// Small inline Lock icon to avoid adding an external dependency (keeps the same look)
function Lock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
  className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

interface BatchData {
  id: string
  title: string
  date: string
  status: string
}

interface BatchCardProps {
  batch: BatchData
  onBatchClick?: () => void
}

export default function BatchCard({ batch, onBatchClick }: BatchCardProps) {
  const isActive = batch.status === "Belum Dikerjakan";
  
  return (
    <div
      onClick={isActive ? onBatchClick : undefined}
      className={`rounded-2xl p-6 border shadow-sm transition-all cursor-pointer 
        ${isActive ? 'hover:shadow-md border-blue-600 bg-white' : 'border-gray-300 bg-gray-100 cursor-not-allowed'}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className={`text-xl font-semibold ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>{batch.title}</h2>
        {!isActive && <Lock className="w-5 h-5 text-gray-400" />}
      </div>
      <p className={`text-sm ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>Jadwal: {batch.date}</p>
    </div>
  )
}
