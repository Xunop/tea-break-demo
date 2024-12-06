import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Paper, User } from "@/lib/apis/types";
import { uploadPaperByReporter, getUserByEmail, relatedPaperAndAuthors } from "@/lib/apis/global";

interface PaperUploadFormProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: (newPaper: Paper) => void;
}

export default function PaperUploadForm({
  user,
  isOpen,
  onOpenChange,
  onUploadSuccess,
}: PaperUploadFormProps) {
  const { toast } = useToast();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [emailSearch, setEmailSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<User[]>([]);
  const [paperDetails, setPaperDetails] = useState<Paper>({
    title: "",
    author: user ? user.username : "",
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
  const handleRemoveAuthor = (userId: number) => {
    const newSelectedAuthors = selectedAuthors.filter(
      (author) => author.id !== userId.toString(),
    );
    setSelectedAuthors(newSelectedAuthors);

    // Update author field with remaining authors' usernames
    setPaperDetails((prev) => ({
      ...prev,
      author: newSelectedAuthors.map((a) => a.id).join(", "),
    }));
  };

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
        file: file.name,
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

    if (!uploadFile) {
      toast({
        title: "上传错误",
        description: "请选择要上传的文件",
        variant: "destructive",
      });
      return;
    }

    try {
      // paperDetails.author 里面存的是用户的 id，使用逗号分割。
      const res = await uploadPaperByReporter(paperDetails, uploadFile);

      if (res.data.code === 200) {
        const newPaperId = res.data.data;
        // 需要额外处理 author 的信息。
        await relatedPaperAndAuthors(newPaperId, paperDetails.author).then((res) => {
          console.log(res)
        })

        toast({
          title: "Success",
          description: "Paper uploaded successfully.",
        });

        const paper = { ...paperDetails, id: newPaperId, author: selectedAuthors.join(",") };

        // Reset form
        setPaperDetails({
          title: "",
          author: user ? user.username : "",
          conference: "",
          year: new Date().getFullYear(),
          abstract: "",
          file: 0,
          attachmentTag: 0,
        });
        setUploadFile(null);
        setSelectedAuthors([]);
        setEmailSearch("");

        // Notify parent component
        onUploadSuccess?.(paper);
        onOpenChange(false);
      } else {
        toast({
          title: "Upload Failed",
          description: res.data.message || "Failed to upload paper.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "An error occurred while uploading the paper.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>上传论文</DialogTitle>
          <DialogDescription>
            输入您的学术论文详细信息，所有字段都是必填的。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
              {selectedAuthors.length > 0 && (
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

          {/* Existing form sections from the original component */}
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
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="custom">Custom Conference</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Conference Input */}
            {conferenceMode === "custom" && (
              <>
                <Label className="text-right">Custom Conference</Label>
                <Input
                  placeholder="Enter conference name"
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

          {/* Year and other sections remain the same */}
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
                <SelectItem value="custom">Custom Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Year Input */}
            {yearMode === "custom" && (
              <>
                <Label className="text-right">Custom Year</Label>
                <Input
                  type="number"
                  placeholder="Enter custom year"
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
              placeholder="Enter paper abstract"
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
                Selected file: {uploadFile.name}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!uploadFile || !paperDetails.title.trim()}
          >
            上传
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
