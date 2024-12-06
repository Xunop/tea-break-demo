"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Users,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  UserCheck,
  Trash2,
  UserX,
} from "lucide-react";
import {
  fetchPapers,
  getAllUsers,
  approveReporter,
  deleteUser,
  banUser,
  getAllReporterRegistrationRequests,
  getUser,
} from "@/lib/apis/global";
import { getCurrentUser } from "@/lib/apis/auth";
import type { User, Paper } from "@/lib/apis/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaperUploadForm from "@/components/upload-papers";
import { Label } from "@/components/ui/label";

type Tab = "论文" | "用户" | "申请";

type PendingApply = {
  id: number;
  userId: number;
  applyNote: string;
  applyTime: string;
  user: User | null;
  username: string;
  email: string;
};

const AdminManagementPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("论文");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<PendingApply[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Paper upload state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // User management handlers
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [banUntilDate, setBanUntilDate] = useState<string>("");
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch data methods
  const fetchAllData = async () => {
    try {
      const res = await getCurrentUser();

      if (res.data.code === 200) {
        const currentUser = res.data.data;
        setUser(currentUser);

        // Check if the user is an admin
        if (currentUser.role === 2) {
          setIsAdmin(true);

          // Fetch additional data only if the user is an admin
          const [papersList, usersList, pendingReportersList] =
            await Promise.all([
              fetchPapers(),
              getAllUsers(),
              getAllReporterRegistrationRequests(),
            ]);

          setPapers(papersList?.data.data || []);
          const usersLists = usersList?.data.data || [];
          // Filter out delete users
          usersLists.forEach((item) => item.id !== deleteUserId);
          setUsers(usersLists);
          setPendingUsers(pendingReportersList?.data.data || []);
        } else {
          setIsAdmin(false);
          router.push("/"); // Redirect non-admin users
        }
      } else {
        console.error("Failed to fetch user", res.data);
        setUser(null);
        router.push("/"); // Redirect if fetching user fails
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "无法获取用户数据",
        variant: "destructive",
      });
      console.error("Failed to fetch admin data", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // User management handlers
  const handleDeleteUser = async (userId: number) => {
    try {
      // await deleteUser(userId);
      setDeleteUserId(userId);
      toast({
        title: "成功",
        description: "用户已删除",
        variant: "default",
      });
      fetchAllData();
    } catch (error) {
      toast({
        title: "错误",
        description: "无法删除用户",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId || !banUntilDate) {
      toast({
        title: "错误",
        description: "请选择用户和日期",
        variant: "destructive",
      });
      return;
    }

    try {
      const banUntilDateFormatted = new Date(banUntilDate)
        .toISOString() // 转为 ISO 8601 格式
        .replace("T", " ") // 替换 T 为空格
        .replace(/:\d+\.\d+Z$/, ""); // 去掉秒、毫秒和 Z（时区标志）

      await banUser(selectedUserId, banUntilDateFormatted);
      toast({
        title: "成功",
        description: `用户已禁言至 ${new Date(banUntilDate).toLocaleString()}`,
        variant: "default",
      });
      setIsBanDialogOpen(false);
      fetchAllData();
    } catch (error) {
      toast({
        title: "错误",
        description: "无法禁止用户",
        variant: "destructive",
      });
    }
  };

  const handlerReporterAction = async (userId: string, action: number) => {
    if (!userId || !action) {
      toast({
        title: "错误",
        description: "请选择用户和操作",
        variant: "destructive",
      });
      return;
    }
    approveReporter(userId, action);
  };

  const handleUnbanUser = async () => {
    if (!selectedUserId) {
      toast({
        title: "错误",
        description: "请选择用户",
        variant: "destructive",
      });
      return;
    }

    try {
      const banUntilDateFormatted = new Date(Date.now())
        .toISOString() // 转为 ISO 8601 格式
        .replace("T", " ") // 替换 T 为空格
        .replace(/:\d+\.\d+Z$/, ""); // 去掉秒、毫秒和 Z（时区标志）

      await banUser(selectedUserId, banUntilDateFormatted);
      toast({
        title: "成功",
        description: "用户已解除禁言",
        variant: "default",
      });
      fetchAllData();
      router.refresh();
    } catch (error) {
      toast({
        title: "错误",
        description: "无法解除禁言",
        variant: "destructive",
      });
    }
  };

  // Filtered and paginated papers
  const filteredPapers = React.useMemo(() => {
    return searchQuery
      ? papers.filter(
          (paper) =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            paper.conference?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : papers;
  }, [papers, searchQuery]);

  const paginatedPapers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPapers.slice(startIndex, startIndex + pageSize);
  }, [filteredPapers, currentPage, pageSize]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPapers.length / pageSize);

  // Render list based on active tab
  const renderList = () => {
    let listToRender: any[] = [];

    switch (activeTab) {
      case "论文":
        listToRender = paginatedPapers;
        break;
      case "用户":
        listToRender = users;
        break;
      case "申请":
        pendingUsers.forEach(async (item) => {
          const user = await getUser(item.userId.toString());
          item.user = user.data.data;
          item.username = user.data.data.username;
          item.email = user.data.data.email;
        });
        listToRender = pendingUsers;
        break;
    }

    return listToRender.length === 0 ? (
      <p className="text-gray-500 text-center">暂未找到数据</p>
    ) : (
      listToRender.map((item) => {
        if (activeTab === "论文") {
          return (
            <div
              key={item.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-md border"
            >
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {/*Authors: {item.authors.join(", ")}*/}
                  作者: {item.author}
                </p>
                <p className="text-xs text-gray-500">
                  会议: {item.conference || "未指定"}
                  <span className="ml-2">年份: {item.year}</span>
                </p>
              </div>
            </div>
          );
        } else if (activeTab === "用户") {
          return (
            <div
              key={item.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-md border"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">{item.email}</p>
                <p className="text-xs text-gray-500">
                  注册时间:{" "}
                  {new Date(item.registrationDate).toLocaleDateString()}
                </p>
                {/* 禁言时间 */}
                <p className="text-xs text-gray-500">
                  禁言至:{" "}
                  {item.banUntil
                    ? new Date(item.banUntil).toLocaleString()
                    : "无"}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedUserId(item.id);
                    setIsBanDialogOpen(true);
                  }}
                >
                  <UserX className="mr-2 h-4 w-4" /> 禁言
                </Button>
                {/* 解除禁言 */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUserId(item.id);
                    handleUnbanUser();
                  }}
                >
                  <UserCheck className="mr-2 h-4 w-4" /> 解除禁言
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteUser(item.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> 删除
                </Button>
              </div>
            </div>
          );
        } else if (activeTab === "申请") {
          return (
            <div
              key={item.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-md border"
            >
              <div>
                <p className="text-sm font-medium">{item.username}</p>
                <p className="text-xs text-gray-500">{item.email}</p>
                <p className="text-xs text-gray-500">
                  注册时间:{" "}
                  {new Date(item.registrationDate).toLocaleDateString()}
                </p>
              </div>
              {item.status === 0 ? (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handlerReporterAction(item.id, 1)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> 同意
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handlerReporterAction(item.id, 2)}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> 拒绝
                  </Button>
                </div>
              ) : item.status === 1 ? (
                <p className="text-sm text-green-500">已同意</p>
              ) : (
                <p className="text-sm text-red-500">已拒绝</p>
              )}
            </div>
          );
        }
      })
    );
  };

  // Pagination rendering
  const renderPaginationItems = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>,
      );
    }

    return pages;
  };

  // Render nothing on server to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-6 w-6" />
            后台管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <div className="flex space-x-4 mb-4">
            {["论文", "用户", "申请"].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                onClick={() => setActiveTab(tab as Tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>

          {/* Paper Upload Button (only on Papers tab) */}
          {activeTab === "论文" && user && (
            <div className="mb-4">
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                上传论文
              </Button>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder={`通过作者，邮件或标题搜索 ${activeTab}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* List Rendering */}
          <div className="space-y-4">{renderList()}</div>

          {/* Pagination for Papers */}
          {activeTab === "论文" && totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">{renderPaginationItems()}</div>
              <div className="flex items-center space-x-2">
                <span>展示</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
                <span>条记录</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paper Upload Form */}
      {user && (
        <PaperUploadForm
          user={user}
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUploadSuccess={(newPaper) => {
            setPapers((prev) => [...prev, newPaper]);
          }}
        />
      )}

      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>禁言</DialogTitle>
            <DialogDescription>选择禁言时间</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banUntil" className="text-right">
                禁言至
              </Label>
              <Input
                id="banUntil"
                type="datetime-local"
                value={banUntilDate}
                onChange={(e) => setBanUntilDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBanUser}>确认</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagementPage;
