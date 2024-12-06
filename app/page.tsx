"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, UploadCloud, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/apis/auth";

/* handler click find friends
 * if user not login, redirect to login page
 * if user login, redirect to friends page
 * */
const handleFindFriends = (router: any) => {
  console.log("Find Friends");
  getCurrentUser().then((res) => {
    console.log(res);
    if (res.data.code === 200) {
      router.push("/friends");
    } else {
      router.push("/login");
    }
  });
};

const HomePage: React.FC = () => {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          欢迎来到 TeaBreak
        </h1>
        <p className="text-lg text-gray-600">
          这是您进行学术合作和论文分享的平台。
        </p>
        <div className="mt-6">
          <Button className="mr-4">立即开始</Button>
          <Button variant="outline">了解更多</Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Feature: Explore Papers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-500" />
              浏览论文
            </CardTitle>
            <CardDescription>浏览并下载各种学术论文。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/papers")}
            >
              发现论文
            </Button>
          </CardContent>
        </Card>

        {/* Feature: Connect with Users */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-6 w-6 text-green-500" />
              用户互动
            </CardTitle>
            <CardDescription>与作者、会议演讲者和与会者互动。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleFindFriends(router)}
            >
              寻找朋友
            </Button>
          </CardContent>
        </Card>

        {/* Feature: Upload Your Work */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-6 w-6 text-purple-500" />
              上传论文
            </CardTitle>
            <CardDescription>将您的研究分享给社区。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => router.push("/papers")}>
              立即上传
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="ghost" className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-600" />
            <span>我的主页</span>
          </Button>
          <Button variant="ghost" className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-gray-600" />
            <span>我的论文</span>
          </Button>
          <Button variant="ghost" className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span>社区</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
