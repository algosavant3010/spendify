import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X, Download } from "lucide-react";

export interface TransactionFilterOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: "income" | "expense" | "all";
  minAmount?: number;
  maxAmount?: number;
  sortBy: "date" | "amount" | "title";
  sortOrder: "asc" | "desc";
}

interface TransactionFiltersProps {
  filters: TransactionFilterOptions;
  onFiltersChange: (filters: TransactionFilterOptions) => void;
  categories: Array<{ id: string; name: string; type: string }>;
  onExportCSV: () => void;
  onExportXLSX: () => void;
}

const TransactionFilters = ({ 
  filters, 
  onFiltersChange, 
  categories,
  onExportCSV,
  onExportXLSX 
}: TransactionFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleReset = () => {
    onFiltersChange({
      type: "all",
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  return (
    <Card>
      <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs sm:text-sm"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            
            <Button variant="outline" size="sm" onClick={onExportCSV} className="text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="hidden sm:inline">Export </span>CSV
            </Button>
            
            <Button variant="outline" size="sm" onClick={onExportXLSX} className="text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="hidden sm:inline">Export </span>PDF
            </Button>
          </div>

          <div className="flex gap-2 sm:ml-auto">
            <div className="flex-1 sm:w-40">
              <Label className="text-xs">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: "date" | "amount" | "title") =>
                  onFiltersChange({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 sm:w-32">
              <Label className="text-xs">Order</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value: "asc" | "desc") =>
                  onFiltersChange({ ...filters, sortOrder: value })
                }
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4 bg-muted/20">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="font-semibold text-sm sm:text-base">Advanced Filters</h3>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs sm:text-sm">
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value: "income" | "expense" | "all") =>
                    onFiltersChange({ ...filters, type: value, categoryId: undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.categoryId || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({ 
                      ...filters, 
                      categoryId: value === "all" ? undefined : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories
                      .filter(cat => !filters.type || filters.type === "all" || cat.type === filters.type)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.minAmount || ""}
                  onChange={(e) =>
                    onFiltersChange({ 
                      ...filters, 
                      minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.maxAmount || ""}
                  onChange={(e) =>
                    onFiltersChange({ 
                      ...filters, 
                      maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionFilters;
