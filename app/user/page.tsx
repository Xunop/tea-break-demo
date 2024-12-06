"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Download, Eye, Info, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/apis/auth";
import {
  registerReporter,
  getUserPapers,
  getPaperViewStatistics,
  getPaperDownloadStatistics,
} from "@/lib/apis/global";
import type { User, Paper } from "@/lib/apis/types";

interface PaperStatistics {
  paperId: number;
  title: string;
  views: number;
  downloads: number;
}

export default function ReporterApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [applyNote, setApplyNote] = useState("");
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [paperStatistics, setPaperStatistics] = useState<PaperStatistics[]>([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userResponse = await getCurrentUser();
        if (userResponse.data.code === 200) {
          const fetchedUser = userResponse.data.data;
          console.log("Fetched user:", fetchedUser);
          setUser(fetchedUser);
          console.log("User:", user);

          if (!fetchedUser) {
            router.push("/login");
            return;
          }

          // Fetch user's papers
          const papersResponse = await getUserPapers(fetchedUser.id);
          if (papersResponse.data.code === 200) {
            const records = papersResponse.data.data.records as Paper[];
            setPapers(records);

            const viewStatsPromises = records.map((paper) =>
              getPaperViewStatistics(paper.id),
            );
            const downloadStatsPromises = records.map((paper) =>
              getPaperDownloadStatistics(paper.id),
            );

            const viewStats = await Promise.all(viewStatsPromises);
            const downloadStats = await Promise.all(downloadStatsPromises);

            console.log("View stats:", viewStats);
            console.log("Download stats:", downloadStats);

            const combinedStats: PaperStatistics[] = records.map(
              (paper, index) => ({
                paperId: paper.id,
                title: paper.title,
                views: viewStats[index].data.data || 0,
                downloads: downloadStats[index].data.data || 0,
              }),
            );

            setPaperStatistics(combinedStats);
          }

          // papers.forEach(async (paper) => {
          //   const viewStatsResponse = await getPaperViewStatistics(paper.id);
          //   const downloadStatsResponse = await getPaperDownloadStatistics(
          //     paper.id,
          //   );
          //   console.log("View stats:", viewStatsResponse.data.data);
          //   console.log("Download stats:", downloadStatsResponse.data.data);
          // });

          // Fetch paper statistics
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      const fileTag = selectedFile ? 1 : 0;
      const response = await registerReporter(applyNote, fileTag);

      if (response.data.code === 200) {
        toast({
          title: "成功",
          description: "你的申请已成功提交。",
        });
        setIsApplicationDialogOpen(false);
      } else {
        toast({
          title: "错误",
          description: response.data.message || "申请提交失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "申请提交失败",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500">加载数据中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FileUp className="mr-3 text-blue-600" size={32} />
          用户中心
        </h1>
        <Button
          variant="default"
          onClick={() => setIsApplicationDialogOpen(true)}
        >
          <Upload className="mr-2" size={16} /> 申请称为会议报告人
        </Button>
      </div>

      {/* Paper Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paperStatistics.map((paperStat) => (
          <Card key={paperStat.paperId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate mr-2">{paperStat.title}</span>
                <Info size={16} className="text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="text-blue-500" size={20} />
                <span>阅读量: {paperStat.views}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="text-green-500" size={20} />
                <span>下载量: {paperStat.downloads}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reporter Application Dialog */}
      <Dialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申请会议报告人</DialogTitle>
            <DialogDescription>
              提交您的申请以及任何相关资格证明，我们会尽快审核您的申请。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block mb-2">Application Note</label>
              <Textarea
                placeholder="请简要说明您为什么申请成为会议报告人。"
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block mb-2">相关资料</label>
              <Input
                type="file"
                onChange={handleFileChange}
                className="w-full"
              />
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-2">
                  已选择文件: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApplicationDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={!applyNote.trim()}
            >
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
