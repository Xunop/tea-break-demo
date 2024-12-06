'use client';
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Paper } from "@/lib/apis/types";

export const columns: ColumnDef<Paper>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium text-gray-800 hover:text-blue-600 transition-colors" onClick={() => {console.log(row.getValue("title"))}}>
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "author",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Author
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("author")}</div>
    ),
  },
  {
    accessorKey: "conference",
    header: "Conference",
    cell: ({ row }) => (
      <div className="text-gray-500">{row.getValue("conference")}</div>
    ),
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => {
      return <div className="text-gray-500">{row.getValue("year")}</div>;
    },
  },
];
