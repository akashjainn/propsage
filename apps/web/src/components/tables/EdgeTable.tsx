import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn, formatEdge, formatCurrency, formatRelativeTime } from '@/lib/utils'

interface EdgeData {
  id: string
  event: string
  playerId: string
  playerName: string
  market: string
  line: number
  bestPrice: number
  fml: number
  edge: number
  booksCount: number
  updatedAt: Date
  book: string
  side: 'over' | 'under'
}

interface EdgeTableProps {
  data: EdgeData[]
  loading?: boolean
  onRowClick?: (row: EdgeData) => void
  className?: string
}

const columnHelper = createColumnHelper<EdgeData>()

export function EdgeTable({ data, loading = false, onRowClick, className }: EdgeTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'edge', desc: true } // Default sort by edge descending
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(
    () => [
      columnHelper.accessor('event', {
        header: 'Event',
        cell: info => (
          <div className="min-w-0">
            <div className="font-medium text-sm text-foreground truncate">
              {info.getValue()}
            </div>
          </div>
        ),
        size: 120,
      }),
      columnHelper.accessor('playerName', {
        header: 'Player',
        cell: info => (
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">
              {info.getValue()}
            </div>
            <div className="text-xs text-secondary truncate">
              {info.row.original.playerId}
            </div>
          </div>
        ),
        size: 140,
      }),
      columnHelper.accessor('market', {
        header: 'Market',
        cell: info => (
          <div className="font-medium text-sm">
            {info.getValue()}
          </div>
        ),
        size: 100,
      }),
      columnHelper.accessor('line', {
        header: 'Line',
        cell: info => (
          <div className="font-mono text-sm">
            {info.row.original.side === 'over' ? 'O' : 'U'} {info.getValue()}
          </div>
        ),
        size: 80,
      }),
      columnHelper.accessor('bestPrice', {
        header: 'Best Price',
        cell: info => (
          <div className="font-mono text-sm">
            {info.getValue() > 0 ? '+' : ''}{info.getValue()}
          </div>
        ),
        size: 90,
      }),
      columnHelper.accessor('fml', {
        header: 'FML',
        cell: info => (
          <div className="font-mono text-sm text-secondary">
            {info.getValue().toFixed(1)}
          </div>
        ),
        size: 70,
      }),
      columnHelper.accessor('edge', {
        header: 'Edge',
        cell: info => {
          const edge = info.getValue()
          return (
            <div className={cn(
              'font-mono text-sm font-semibold',
              edge > 0.05 && 'text-positive',
              edge > 0.02 && edge <= 0.05 && 'text-warning',
              edge <= 0.02 && 'text-negative'
            )}>
              {formatEdge(edge)}
            </div>
          )
        },
        size: 80,
      }),
      columnHelper.accessor('book', {
        header: 'Book',
        cell: info => (
          <div className="text-sm font-medium">
            {info.getValue()}
          </div>
        ),
        size: 90,
      }),
      columnHelper.accessor('booksCount', {
        header: 'Books',
        cell: info => (
          <div className="text-sm text-center">
            {info.getValue()}
          </div>
        ),
        size: 60,
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Updated',
        cell: info => (
          <div className="text-xs text-secondary">
            {formatRelativeTime(info.getValue())}
          </div>
        ),
        size: 80,
      }),
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const { rows } = table.getRowModel()
  
  const parentRef = React.useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5,
  })

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-surface animate-pulse rounded" />
          <div className="h-8 w-48 bg-surface animate-pulse rounded" />
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 bg-surface animate-pulse rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Edge Opportunities
          </h2>
          <div className="text-sm text-secondary">
            {rows.length} edges found
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className={cn(
              'px-3 py-2 text-sm rounded-lg border border-border',
              'bg-surface text-foreground placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-positive focus:border-transparent'
            )}
            placeholder="Search edges..."
          />
          
          <button
            onClick={() => {
              // Export to CSV functionality
              const csvContent = [
                columns.map(col => col.header).join(','),
                ...rows.map(row => 
                  columns.map(col => {
                    const value = row.getValue(col.id as keyof EdgeData)
                    return typeof value === 'string' ? `"${value}"` : value
                  }).join(',')
                )
              ].join('\n')
              
              const blob = new Blob([csvContent], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'edges.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg',
              'bg-brand text-foreground hover:bg-brand/80',
              'transition-colors duration-200'
            )}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-hidden">
          {/* Header */}
          <div className="bg-surface border-b border-border">
            {table.getHeaderGroups().map(headerGroup => (
              <div key={headerGroup.id} className="flex">
                {headerGroup.headers.map(header => (
                  <div
                    key={header.id}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-secondary',
                      'cursor-pointer select-none hover:bg-surface-hover',
                      'transition-colors duration-150'
                    )}
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Virtualized Body */}
          <div
            ref={parentRef}
            className="h-96 overflow-auto custom-scroll"
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index]
                return (
                  <div
                    key={row.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      'flex items-center border-b border-border hover:bg-surface-hover',
                      'cursor-pointer transition-colors duration-150'
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <div
                        key={cell.id}
                        className="px-4 py-3"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}