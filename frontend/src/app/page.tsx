'use client'

import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })

export default function Page() {
  return (
    <div className="container mx-auto p-4">

      <div className="w-2/3 mx-auto h-[600px] border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <LeafletMap className="h-full" />
      </div>
    </div>
  )
}
