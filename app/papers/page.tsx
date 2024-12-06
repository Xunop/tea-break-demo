"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  FileText,
  FilterIcon,
  Download,
  Eye,
  ChevronFirst,
  ChevronLast,
  Edit,
  Trash2,
  Upload,
} from "lucide-react";
import type { Paper, User } from "@/lib/apis/types";
import { getCurrentUser } from "@/lib/apis/auth";
import {
  fetchPapers,
  deletePaper,
  uploadPaperByReporter,
  downloadPaper,
  getPaperAuthors,
  setPaperDownloadStatistics,
} from "@/lib/apis/global";
import PaperUploadForm from "@/components/upload-papers";

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    conference: "all",
    year: "all",
  });

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [paperToDownload, setPaperToDownload] = useState<Paper | null>(null);
  const [authors, setAuthors] = useState<string>("");

  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res.data.code !== 200) {
          router.push("/login");
        } else {
          setUser(res.data.data);

          // Fetch papers only after getting the current user
          fetchPapers().then((papersRes) => {
            if (papersRes.data.code === 200) {
              papersRes.data.data.forEach(async (paper) => {
                const authors = await getPaperAuthors(paper.id);
                // console.log('authors res', authors)
                if (authors.data.data !== null) {
                  setAuthors(
                    authors.data.data
                      .map((author) => author.username)
                      .join(", "),
                  );
                }
                // paper.author = authors;
                paper.year = new Date(paper.createTime).getFullYear();
              });
              setPapers(papersRes.data.data);
            }
          });
        }
      })
      .catch((err) => {
        console.error("Failed to get current user:", err);
        router.push("/login");
      });
  }, []);

  // Filtered and paginated papers
  const filteredPapers = useMemo(() => {
    return papers.filter(
      (paper) =>
        (filters.conference === "all" ||
          paper.conference.includes(filters.conference)) &&
        (filters.year === "all" || paper.year.toString() === filters.year),
    );
  }, [papers, filters]);

  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    filteredPapers.forEach((paper) => (paper.author = authors));
    return filteredPapers.slice(startIndex, startIndex + pageSize);
  }, [filteredPapers, currentPage, pageSize, authors]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPapers.length / pageSize);

  // console.log("Papers:", paginatedPapers);

  // Pagination render helper
  const renderPaginationItems = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust start and end pages to always show 5 pages if possible
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <PaginationItem key="first">
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            className="cursor-pointer"
          >
            <ChevronFirst size={16} />
          </PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        pages.push(
          <PaginationItem key="first-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === currentPage}
            onClick={() => setCurrentPage(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <PaginationItem key="last-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
      pages.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            className="cursor-pointer"
          >
            <ChevronLast size={16} />
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return pages;
  };

  const handleDownloadPaper = async () => {
    console.log("Downloading paper...", paperToDownload);

    if (!user) {
      toast({
        title: "未授权",
        description: "您必须登录才能下载论文。",
        variant: "destructive",
      });
      return;
    }

    if (!paperToDownload) {
      toast({
        title: "错误",
        description: "未选择要下载的论文。",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await downloadPaper(Number(paperToDownload.id), 0);

      if (!res || !(res.data instanceof Blob)) {
        toast({
          title: "错误",
          description: "下载论文失败。响应数据无效。",
          variant: "destructive",
        });
        return;
      }

      await setPaperDownloadStatistics(paperToDownload.id);

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${paperToDownload.title}.pdf`);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "成功",
        description: "论文下载成功。",
      });
    } catch (error) {
      console.error("Error downloading paper:", error);
      toast({
        title: "错误",
        description: "下载论文时发生错误。",
        variant: "destructive",
      });
    }
  };

  // Handle paper deletion
  const handleDeletePaper = async () => {
    console.log("Deleting paper...", paperToDelete);
    if (!user || user.role !== 2 || !paperToDelete) {
      toast({
        title: "未授权",
        description: "只有管理员可以删除论文。",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await deletePaper(paperToDelete.id.toString());
      if (res.data.code === 200) {
        // Remove the deleted paper from the list
        setPapers((prev) => prev.filter((p) => p.id !== paperToDelete.id));
        toast({
          title: "成功",
          description: "论文删除成功。",
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
      } else {
        toast({
          title: "错误",
          description: res.data.message || "删除论文失败。",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "删除论文时发生错误。",
        variant: "destructive",
      });
    }
  };

  if (!paginatedPapers) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500">正在加载论文详情...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-3 text-blue-600" size={32} />
          学术论文仓库
        </h1>

        <div className="flex space-x-4">
          {/* Upload Button (visible to logged-in users) */}
          {user && (
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="mr-2" size={16} /> 上传论文
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FilterIcon className="mr-2" size={16} /> 高级筛选
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>高级论文筛选</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">会议</label>
                  <Select
                    value={filters.conference}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, conference: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择会议" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有会议</SelectItem>
                      <SelectItem value="NeurIPS">NeurIPS</SelectItem>
                      <SelectItem value="QCRYPT">QCRYPT</SelectItem>
                      <SelectItem value="ACM FAccT">ACM FAccT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">年份</label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, year: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择年份" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">选择年份</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedPapers}
        renderActions={(paper) => (
          <div className="flex space-x-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/papers/${paper.id}`)}
            >
              <Eye className="mr-2" size={16} /> 查看详情
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPaperToDownload(paper);
                handleDownloadPaper();
              }}
            >
              <Download className="mr-2" size={16} /> 下载
            </Button>

            {/* Edit Button (for administrators) */}
            {user && (user.role === 2 || user.role === 3) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/papers/${paper.id}/edit`)}
              >
                <Edit className="mr-2" size={16} /> 编辑
              </Button>
            )}

            {/* Delete Button (for administrators) */}
            {user && user.role === 2 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setPaperToDelete(paper);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2" size={16} /> 删除
              </Button>
            )}
          </div>
        )}
      />

      {/* Upload Paper Dialog */}
      <PaperUploadForm
        user={user!}
        isOpen={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadSuccess={(newPaper) => {
          console.log("New paper uploaded:", newPaper);
          // This will add the new paper to the list automatically
          setPapers((prev) => [...prev, newPaper]);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除论文</DialogTitle>
            <DialogDescription>
              您确定要删除这篇论文吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeletePaper}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center space-x-2">
          <span>显示</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1); // Reset to first page when changing page size
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>条记录</span>
        </div>

        <div className="text-sm text-gray-500 mr-4">
          显示 {(currentPage - 1) * pageSize + 1} 到{" "}
          {Math.min(currentPage * pageSize, filteredPapers.length)} 共{" "}
          {filteredPapers.length} 条记录
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {renderPaginationItems()}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
