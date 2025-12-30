/**
 * Stock Transfers Page
 * Browse and manage stock transfers (WH -> DC movements)
 */

import { type ChangeEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse, Calendar, Package, ArrowRight, Truck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { Badge } from '@/components/ui/badge'
import { useFrappeGetCall } from 'frappe-react-sdk'

interface Transfer {
  name: string
  transfer_type: string
  source_warehouse: string
  dest_warehouse: string
  scheduled_date: string
  sfa_state: string
  odoo_state: string
  total_items: number
  total_deliveries: number
  driver_name?: string
  vehicle?: string
  odoo_name?: string
}

export default function StockTransfers() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [stateFilter, setStateFilter] = useState('all')

  const { data, isLoading } = useFrappeGetCall<{ message: { success: boolean, transfers: Transfer[], count: number } }>(
    'frm.api.stock_transfer.get_my_transfers',
    {
      state: stateFilter === 'all' ? undefined : stateFilter,
      include_completed: stateFilter === 'all' || stateFilter === 'completed'
    },
    'transfer-list',
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  const transfers = data?.message?.transfers || []
  const totalCount = data?.message?.count || 0

  // Filter locally by transfer ID or warehouse
  const filteredTransfers = searchTerm
    ? transfers.filter(transfer =>
        transfer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.source_warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.dest_warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transfer.odoo_name && transfer.odoo_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : transfers

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleTransferClick = (transfer: Transfer) => {
    navigate(`/transfers/${transfer.name}`)
  }

  // SFA State helpers
  const getSfaStateVariant = (state: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (state?.toLowerCase()) {
      case 'pending':
        return 'outline'
      case 'loading':
        return 'secondary'
      case 'in_transit':
        return 'default'
      case 'arrived':
        return 'default'
      case 'completed':
        return 'default'
      case 'returned':
        return 'destructive'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatSfaState = (state: string | undefined) => {
    switch (state?.toLowerCase()) {
      case 'pending':
        return 'Pending'
      case 'loading':
        return 'Loading'
      case 'in_transit':
        return 'In Transit'
      case 'arrived':
        return 'Arrived'
      case 'completed':
        return 'Completed'
      case 'returned':
        return 'Returned'
      case 'cancelled':
        return 'Cancelled'
      default:
        return state || 'Pending'
    }
  }

  const formatTransferType = (type: string | undefined) => {
    switch (type) {
      case 'wh_to_dc':
        return 'WH to DC'
      case 'dc_to_dc':
        return 'DC to DC'
      case 'return_to_wh':
        return 'Return to WH'
      default:
        return type || 'Transfer'
    }
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <StandardHeader />

      {/* ===== Content ===== */}
      <Main className="space-y-6">
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Stock Transfers
          </h1>
          <p className='text-muted-foreground'>
            WH to DC movements for hub drivers
          </p>
        </div>

        {/* Search and Actions - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search transfers...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: State filter */}
          <div className='flex items-center justify-between gap-4'>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue>All States</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All States</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='loading'>Loading</SelectItem>
                <SelectItem value='in_transit'>In Transit</SelectItem>
                <SelectItem value='arrived'>Arrived</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='returned'>Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className='shadow-sm' />

        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && filteredTransfers.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : filteredTransfers.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No transfers found
            </li>
          ) : (
            filteredTransfers.map((transfer) => (
              <li
                key={transfer.name}
                className='rounded-sm border p-4 hover:shadow-md cursor-pointer'
                onClick={() => handleTransferClick(transfer)}
              >
                <div className='mb-4'>
                  <div className='flex items-center justify-between mb-1'>
                    <h2 className='font-semibold text-lg'>{transfer.name}</h2>
                    <Badge variant="outline" className="text-xs">
                      {formatTransferType(transfer.transfer_type)}
                    </Badge>
                  </div>
                  {transfer.odoo_name && (
                    <p className='text-xs text-muted-foreground mb-2'>Odoo: {transfer.odoo_name}</p>
                  )}

                  {/* Route */}
                  <div className='flex items-center gap-2 text-sm font-medium mb-3'>
                    <Warehouse className='h-4 w-4 text-muted-foreground' />
                    <span className='truncate'>{transfer.source_warehouse}</span>
                    <ArrowRight className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                    <span className='truncate'>{transfer.dest_warehouse}</span>
                  </div>

                  <Badge variant={getSfaStateVariant(transfer.sfa_state)}>
                    {formatSfaState(transfer.sfa_state)}
                  </Badge>
                </div>

                <div className='space-y-2 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground flex items-center gap-1'>
                      <Calendar className='h-4 w-4' />
                      Scheduled:
                    </span>
                    <span className='font-medium'>
                      {new Date(transfer.scheduled_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground flex items-center gap-1'>
                      <Package className='h-4 w-4' />
                      Items / Deliveries:
                    </span>
                    <span className='font-medium'>
                      {transfer.total_items} / {transfer.total_deliveries}
                    </span>
                  </div>

                  {transfer.driver_name && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground flex items-center gap-1'>
                        <Truck className='h-4 w-4' />
                        Driver:
                      </span>
                      <span className='font-medium text-xs truncate max-w-[120px]'>
                        {transfer.driver_name}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {filteredTransfers.length} of {totalCount} transfers
          </div>
        )}
      </Main>
    </>
  )
}
