"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  User,
  University,
  Eye,
  MessageCircle,
  Send,
  FileText,
  Download,
  Reply,
} from "lucide-react";
import type { Paper, Comment } from "@/lib/apis/types";
import {
  fetchPaper,
  fetchComments,
  downloadPaper,
  addCommentToPaper,
  addChildComment,
  getUser,
  getPaperViewStatistics,
  setPaperViewStatistics,
  setPaperDownloadStatistics,
} from "@/lib/apis/global";
import { getCurrentUser } from "@/lib/apis/auth";

const AdaptiveTextarea: React.FC<{
  value: string;
  className?: string;
}> = ({ value, className }) => {
  const [height, setHeight] = useState("auto");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to 'auto' to correctly calculate scrollHeight
      textareaRef.current.style.height = "auto";

      // Calculate the required height
      const scrollHeight = textareaRef.current.scrollHeight;

      // Set a max height (e.g., 200px) to prevent extremely long textareas
      const maxHeight = 200;
      setHeight(`${Math.min(scrollHeight, maxHeight)}px`);
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      readOnly
      style={{
        height: height,
        overflow: "hidden",
        resize: "none",
      }}
      className={`w-full px-3 py-2 bg-gray-50 rounded-md border border-gray-300 text-sm focus:outline-none ${className}`}
    />
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PaperDetailsPage: React.FC = () => {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const paperID = params.id;

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;

    addCommentToPaper(paperID, newComment).then((res) => {
      if (res.data.code !== 200) {
        toast({
          title: "错误",
          description: "评论添加失败，请稍后再试。",
          variant: "destructive",
        });
        return;
      } else {
        const newCommentObj: Comment = {
          id: res.data.data.id,
          user: user,
          content: newComment,
          createAt: res.data.data.createAt,
        };

        setComments([...comments, newCommentObj]);
        setNewComment("");
      }
    });
  };

  const handleSubmitReply = (parentCommentId: string) => {
    if (!replyContent.trim() || !user) return;

    console.log("reply", paperID, parentCommentId, replyContent);
    addChildComment(
      Number.parseInt(paperID),
      Number.parseInt(parentCommentId),
      replyContent,
    ).then((res) => {
      console.log("reply", res);
      if (res.data.code !== 200) {
        toast({
          title: "错误",
          description: "评论添加失败，请稍后再试。",
          variant: "destructive",
        });
        return;
      } else {
        const newReply: Comment = {
          id: res.data.data.id,
          user: user,
          content: replyContent,
          createAt: new Date().toISOString(),
        };

        const updatedComments = comments.map((comment) => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              children: [...(comment.children || []), newReply],
            };
          }
          return comment;
        });

        setComments(updatedComments);
        setReplyContent("");
        setReplyingTo(null);
      }
    });
  };

  const handleDownloadPaper = async (paperID: number, title: string) => {
    if (!user) {
      toast({
        title: "未授权",
        description: "您必须登录才能下载论文。",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await downloadPaper(paperID, 0);

      if (!res || !(res.data instanceof Blob)) {
        toast({
          title: "错误",
          description: "下载论文时出错。",
          variant: "destructive",
        });
        return;
      }

      await setPaperDownloadStatistics(paperID);

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title}.pdf`);
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
        description: "下载论文时出错。",
        variant: "destructive",
      });
    }
  };

  const handlePreviewPaper = async (paperID: number, path: string) => {
    if (!user) {
      toast({
        title: "未授权",
        description: "您必须登录才能预览论文。",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await setPaperViewStatistics(paperID);
      if (res.data.code !== 200) {
        console.log("error", res.data);
      }
      window.open("http://localhost:9000/paper/" + path, "_blank");
    } catch (error) {
      toast({
        title: "错误",
        description: "预览论文时出错。",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    getCurrentUser().then((res) => {
      if (res.data.code === 200) {
        setUser(res.data.data);
        fetchPaper(paperID.toString()).then((res) => {
          if (res.data.code === 200) {
            const year = new Date(res.data.data.createTime).getFullYear();
            res.data.data.year = year
            setPaper(res.data.data);

            fetchComments(paperID.toString()).then(async (res) => {
              if (res.data.code === 200) {
                const fillUserData = async (
                  comment: Comment,
                ): Promise<Comment> => {
                  const user = await getUser(comment.userId).then((res) => {
                    if (res.data.code === 200) {
                      return res.data.data;
                    }
                    return null;
                  });
                  comment.user = user;
                  comment.userId = user.id;

                  if (comment.children) {
                    comment.children = await Promise.all(
                      comment.children.map(fillUserData),
                    );
                  }

                  return comment;
                };

                const comments: Comment[] = await Promise.all(
                  res.data.data.map((comment: Comment) =>
                    fillUserData(comment),
                  ),
                );

                // console.log("comments", comments);
                // console.log("create_at", comments[0].createAt);

                setComments(comments);
              }
            });
          }
        });
      } else {
        setError("用户不存在");
        router.push("/login");
      }
    });
  }, [paperID]);

  if (!paper) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Paper Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-6 w-6" />
            论文详情
          </CardTitle>
          <CardDescription>有关研究的综合信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="mr-2 h-4 w-4" /> 标题
            </label>
            <AdaptiveTextarea value={paper.title} className="font-semibold" />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="mr-2 h-4 w-4" /> 作者
            </label>
            <AdaptiveTextarea value={paper.author} />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <University className="mr-2 h-4 w-4" /> 会议
            </label>
            <AdaptiveTextarea value={`${paper.conference} (${paper.year})`} />
          </div>

          {/*paper.doi && (
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="mr-2 h-4 w-4" /> DOI
              </label>
              <AdaptiveTextarea value={paper.doi} />
            </div>
          )*/}

          {paper.abstract && (
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="mr-2 h-4 w-4" /> 摘要
              </label>
              <AdaptiveTextarea value={paper.abstract} />
            </div>
          )}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="mr-2 h-4 w-4" /> 论文
            </label>
            <div className="space-y-2">
              {
                <div
                  key={paper.paperPath.split("/").pop()}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-md border"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">
                        {paper.paperPath.split("/").pop()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {/*paper.paperPath.split(".").pop().toUpperCase()} • {formatFileSize(paper.size)*/}
                        {paper.paperPath.split(".").pop().toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center justify-center space-x-1"
                      onClick={() => handleDownloadPaper(paper.id, paper.title)}
                    >
                      <Download className="h-4 w-4" />
                      <span>下载</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center justify-center space-x-1"
                      onClick={() =>
                        handlePreviewPaper(paper.id, paper.paperPath)
                      }
                    >
                      <Eye className="h-4 w-4" />
                      <span>预览</span>
                    </Button>
                  </div>
                </div>
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="mr-2 h-6 w-6" />
            评论
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Comment Input */}
          {user ? (
            <div className="mb-4">
              <Textarea
                placeholder="分享您的想法..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-2"
                rows={3}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" /> 发送
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => {
                /* Navigate to login */
              }}
            >
              登录以发表评论
            </Button>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center"> 暂无评论 </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 p-3 rounded-lg border"
                >
                  {/* Main Comment */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {comment.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>

                    {/* Reply Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="mr-2 h-4 w-4" /> 回复
                    </Button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && user && (
                    <div className="mt-2 pl-4 border-l-2">
                      <Textarea
                        placeholder="回复..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="mb-2"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          <Send className="mr-2 h-4 w-4" /> 回复
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyingTo(null)}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.children && comment.children.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 space-y-2">
                      {comment.children.map((reply) => (
                        <div
                          key={`reply-${reply.id}`}
                          className="bg-white p-2 rounded-md"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-xs flex items-center">
                              <User className="mr-2 h-3 w-3" />
                              {reply.user.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.createAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperDetailsPage;
