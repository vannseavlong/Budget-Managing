'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Edit,
  Trash2,
} from 'lucide-react';

interface BudgetItem {
  id: string;
  name: string;
  cost: number;
  spent: number;
  status: 'Spent' | 'Not Yet';
}

interface BudgetTableProps {
  items: BudgetItem[];
  onToggleStatus: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  pageSize?: number;
}

export function BudgetTable({
  items,
  onToggleStatus,
  onEdit,
  onDelete,
  pageSize = 5,
}: BudgetTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const ActionDropdown = ({ item }: { item: BudgetItem }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => onToggleStatus(item.id)}
          className="cursor-pointer"
        >
          <X className="h-4 w-4 mr-2" />
          Mark as {item.status === 'Spent' ? 'Not Spent' : 'Spent'}
        </DropdownMenuItem>
        {onEdit && (
          <DropdownMenuItem
            onClick={() => onEdit(item.id)}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(item.id)}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full">
      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {currentItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{item.name}</h3>
              <ActionDropdown item={item} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">${item.cost}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(item.id)}
                  className={`text-xs px-3 py-1 ${
                    item.status === 'Spent'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.status}
                </Button>
              </div>
              <div className="text-sm text-gray-600">Spent: ${item.spent}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length ? (
                currentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>${item.cost}</TableCell>
                    <TableCell>${item.spent}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleStatus(item.id)}
                        className={`text-xs px-3 py-1 ${
                          item.status === 'Spent'
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item.status}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionDropdown item={item} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No budget items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, items.length)} of{' '}
            {items.length} items
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
