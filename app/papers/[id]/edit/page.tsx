"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Paper, User } from "@/lib/apis/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchPaper,
  editPaper,
  getUserByEmail,
  relatedPaperAndAuthors,
  getPaperAuthors,
} from "@/lib/apis/global";
import { getCurrentUser } from "@/lib/apis/auth";
import { X } from "lucide-react";
import { useParams } from 'next/navigation'

export default function PaperEditPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // const unwrappedParams = use(params.id);
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [originAuthors, setAuthors] = useState<User[]>([]);
  const [emailSearch, setEmailSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<User[]>([]);
  const [paperDetails, setPaperDetails] = useState<Paper>({
    title: "",
    author: "",
    conference: "ACM",
    year: new Date().getFullYear(),
    abstract: "",
    file: 0,
    attachmentTag: 0,
  });

  const [conferenceMode, setConferenceMode] = useState<"preset" | "custom">(
    "preset",
  );
  const [yearMode, setYearMode] = useState<"preset" | "custom">("preset");

  // Debounce email search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailSearch.trim() && emailSearch.includes("@")) {
        handleEmailSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [emailSearch]);

  // Email search handler
  const handleEmailSearch = async () => {
    try {
      const response = await getUserByEmail(emailSearch);
      if (response.data.code === 200 && response.data.data) {
        setSearchResults([response.data.data]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching user by email:", error);
      setSearchResults([]);
    }
  };

  // Select an author from search results
  const handleSelectAuthor = (user: User) => {
    // Prevent duplicate authors
    if (!selectedAuthors.some((author) => author.id === user.id)) {
      const newSelectedAuthors = [...selectedAuthors, user];
      setSelectedAuthors(newSelectedAuthors);

      // Update author field with selected authors' usernames
      setPaperDetails((prev) => ({
        ...prev,
        author: newSelectedAuthors.map((a) => a.id).join(", "),
      }));

      // Clear search
      setEmailSearch("");
      setSearchResults([]);
    }
  };

  // Remove an author
  const handleRemoveAuthor = (userId: string) => {
    console.log("Removing author:", userId);
    const newSelectedAuthors = selectedAuthors.filter((author) => {
      author.id !== userId.toString();
    });
    setSelectedAuthors(newSelectedAuthors);

    // Update author field with remaining authors' usernames
    setPaperDetails((prev) => ({
      ...prev,
      author: newSelectedAuthors.map((a) => a.id).join(", "),
    }));
  };

  useEffect(() => {
    const fetchPaperDetails = async () => {
      try {
        const userResponse = await getCurrentUser();
        if (userResponse.data.code !== 200) {
          router.push("/login");
          return;
        }
        setUser(userResponse.data.data);

        const paperResponse = await fetchPaper(id);
        if (paperResponse.data.code === 200) {
          const fetchedPaper = paperResponse.data.data;
          // TODO: Fetch related authors
          const authors = await getPaperAuthors(id).then((res) => res.data.data);
          setAuthors(authors);
          setSelectedAuthors(authors);

          setPaperDetails({
            ...fetchedPaper,
            year: fetchedPaper.year || new Date().getFullYear(),
            author: authors,
          });

          // Set conference and year modes
          setConferenceMode(
            ["NeurIPS", "QCRYPT", "ACM FAccT", "Other"].includes(
              fetchedPaper.conference,
            )
              ? "preset"
              : "custom",
          );
          setYearMode(
            fetchedPaper.year === new Date().getFullYear()
              ? "preset"
              : "custom",
          );
        } else {
          toast({
            title: "错误",
            description: "获取论文详情出错",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching paper:", error);
        toast({
          title: "错误",
          description: "获取论文详情出错",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaperDetails();
  }, [id, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setPaperDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPaperDetails((prev) => ({
        ...prev,
        paperFile: file,
      }));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!paperDetails.title.trim()) {
      toast({
        title: "错误",
        description: "请输入论文标题",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Submitting paper details:", paperDetails, uploadFile);
      const res = await editPaper(
        Number.parseInt(id),
        paperDetails,
        uploadFile ? uploadFile : undefined,
      );
      
      // TODO: Update authors
      const ids = selectedAuthors.map((author) => author.id);
      await relatedPaperAndAuthors(id, ids.join(",")).then((res) => {
        console.log("Related authors:", res.data.data);
      })

      if (res.data.code === 200) {
        toast({
          title: "成功",
          description: "论文信息已更新",
        });
        router.push("/papers");
      } else {
        toast({
          title: "更新失败",
          description: res.data.message || "更新论文失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "错误",
        description: "更新论文失败",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        加载论文信息...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center w-full p-4">
      <div className="w-full max-w-[600px] bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">编辑论文信息</h1>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              标题
            </Label>
            <Input
              id="title"
              name="title"
              value={paperDetails.title}
              onChange={handleInputChange}
              placeholder="Enter paper title"
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="author" className="text-right">
              作者
            </Label>
            <div className="col-span-3 flex flex-col">
              {/* Selected Authors Chips */}
              {selectedAuthors && selectedAuthors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedAuthors.map((author) => (
                    <div
                      key={author.id}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                    >
                      {author.username}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-5 w-5 p-0 rounded-full"
                        onClick={() => handleRemoveAuthor(author.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Email Search Input */}
              <div className="relative">
                <Input
                  placeholder="Search by email to add authors"
                  value={emailSearch}
                  onChange={(e) => {
                    setEmailSearch(e.target.value);
                  }}
                  className="w-full"
                />

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelectAuthor(user)}
                      >
                        {user.username} ({user.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="conference" className="text-right">
              会议
            </Label>
            <Select
              value={
                conferenceMode === "preset" ? paperDetails.conference : "custom"
              }
              onValueChange={(value) => {
                if (value === "custom") {
                  setConferenceMode("custom");
                  setPaperDetails((prev) => ({ ...prev, conference: "" }));
                } else {
                  setConferenceMode("preset");
                  setPaperDetails((prev) => ({ ...prev, conference: value }));
                }
              }}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Conference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NeurIPS">NeurIPS</SelectItem>
                <SelectItem value="QCRYPT">QCRYPT</SelectItem>
                <SelectItem value="ACM FAccT">ACM FAccT</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Conference Input */}
            {conferenceMode === "custom" && (
              <>
                <Label className="text-right">其他会议名称</Label>
                <Input
                  placeholder="输入会议名称"
                  value={paperDetails.conference}
                  onChange={(e) =>
                    setPaperDetails((prev) => ({
                      ...prev,
                      conference: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              年份
            </Label>
            <Select
              value={
                yearMode === "preset" ? paperDetails.year.toString() : "custom"
              }
              onValueChange={(value) => {
                if (value === "custom") {
                  setYearMode("custom");
                  setPaperDetails((prev) => ({ ...prev, year: 0 }));
                } else {
                  setYearMode("preset");
                  setPaperDetails((prev) => ({
                    ...prev,
                    year: parseInt(value),
                  }));
                }
              }}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: 20 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
                <SelectItem value="custom">其他年份</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Year Input */}
            {yearMode === "custom" && (
              <>
                <Label className="text-right">其他年份</Label>
                <Input
                  type="number"
                  placeholder="输入年份"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={paperDetails.year === 0 ? "" : paperDetails.year}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPaperDetails((prev) => ({
                      ...prev,
                      year: value ? parseInt(value) : 0,
                    }));
                  }}
                  className="col-span-3"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="abstract" className="text-right">
              摘要
            </Label>
            <Textarea
              id="abstract"
              name="abstract"
              value={paperDetails.abstract}
              onChange={handleInputChange}
              placeholder="输入论文摘要"
              className="col-span-3 h-24"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              PDF 文件
            </Label>
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="col-span-3"
            />
            {uploadFile && (
              <div className="col-span-4 text-sm text-gray-500 text-right">
                已选择的文件: {uploadFile?.name}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            <Button
              variant="outline"
              className="col-span-2"
              onClick={() => router.push("/papers")}
            >
              取消
            </Button>
            <Button
              className="col-span-2"
              onClick={handleSubmit}
              disabled={!paperDetails.title.trim()}
            >
              提交
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
