"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  UserPlus,
  UserMinus,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  addFriendByEmail,
  getUserByEmail,
  deleteFriend,
  getAllFriendList,
  getFriendRequestList,
  getReceivedFriendRequestList,
  handleFriendRequest,
  addFollow,
  cancelFollow,
  getAllFollowList,
  getUser,
} from "@/lib/apis/global";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@/lib/apis/types";

type Tab = "好友" | "好友申请" | "我的关注";

interface UserWithMutualFriends extends UserType {
  mutualFriends?: number;
  name: string;
}

const FriendsPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("好友");
  const [friends, setFriends] = useState<UserWithMutualFriends[]>([]);
  const [friendRequests, setFriendRequests] = useState<UserWithMutualFriends[]>(
    [],
  );
  const [receivedRequests, setReceivedRequests] = useState<
    UserWithMutualFriends[]
  >([]);
  // 0: Pending, 1: Accepted, 2: Rejected
  const [receiveRequestStatus, setReceiveRequestStatus] = useState<
    0 | 1 | 2
  >(0);

  const [following, setFollowing] = useState<UserWithMutualFriends[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [foundUser, setFoundUser] = useState<UserType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Comprehensive data fetching
  const fetchAllData = async () => {
    try {
      const [friendList, sentRequests, receivedList, followList] =
        await Promise.all([
          getAllFriendList(),
          getFriendRequestList(),
          getReceivedFriendRequestList(),
          getAllFollowList(),
        ]);

      receivedList?.data.data.forEach((element) => {
        if (element["status"] === 1 || element["status"] === 2 || element["status"] === 0) {
          setReceiveRequestStatus(element["status"]);
        }
      });

      // Helper function to convert user ID lists to UserWithMutualFriends
      const convertToUserWithMutualFriends = async (
        list: any[],
        idKey: string,
        calculateMutualFriends: boolean = false,
      ): Promise<UserWithMutualFriends[]> => {
        const userPromises = list.map(async (item) => {
          const userId = item[idKey];
          const user = await getUser(userId).then((res) => res.data.data);

          // Prepare user object with mutual friends calculation if needed
          const userWithDetails: UserWithMutualFriends = {
            ...user,
            mutualFriends: undefined,
          };

          return userWithDetails;
        });
        return Promise.all(userPromises);
      };

      // Convert different lists
      const friends = await convertToUserWithMutualFriends(
        friendList?.data.data || [],
        "id",
        true,
      );

      const sentFriendRequests = await convertToUserWithMutualFriends(
        sentRequests?.data.data || [],
        "toUserId",
      );

      const receivedFriendRequests = await convertToUserWithMutualFriends(
        receivedList?.data.data || [],
        "fromUserId",
      );

      const following = await convertToUserWithMutualFriends(
        followList?.data.data || [],
        "id",
      );

      // Update state with converted lists
      setFriends(friends);
      setFriendRequests(sentFriendRequests);
      setReceivedRequests(receivedFriendRequests);
      setFollowing(following);
    } catch (error) {
      toast({
        title: "错误",
        description: "获取好友数据失败",
        variant: "destructive",
      });
      console.error("Failed to fetch friends data", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Render nothing on server to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // New method to search user by email
  const handleSearchUserByEmail = async () => {
    if (!newFriendEmail.trim()) {
      toast({
        title: "错误",
        description: "请输入邮箱",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      const response = await getUserByEmail(newFriendEmail);

      if (response?.data?.data) {
        setFoundUser(response.data.data);
        toast({
          title: "查找成功",
          description: "找到用户",
          variant: "default",
        });
      } else {
        setFoundUser(null);
        toast({
          title: "未找到用户",
          description: "没有找到该邮箱对应的用户",
          variant: "destructive",
        });
      }
    } catch (error) {
      setFoundUser(null);
      toast({
        title: "错误",
        description: "查找用户失败",
        variant: "destructive",
      });
      console.error("Failed to search user by email", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Modify existing add friend handler to use found user
  const handleAddFriend = async () => {
    if (!foundUser) return;

    try {
      const res = await addFriendByEmail(newFriendEmail);
      if (res.data.code !== 200) {
        toast({
          title: "错误",
          description: "添加好友失败",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "成功",
        description: "好友请求已发送",
        variant: "default",
      });

      // Reset states
      setNewFriendEmail("");
      setFoundUser(null);

      // Refresh friend requests
      const updatedRequests = await getFriendRequestList();
      setFriendRequests(
        Array.isArray(updatedRequests?.data) ? updatedRequests.data : [],
      );
    } catch (error) {
      toast({
        title: "错误",
        description: "添加好友失败",
        variant: "destructive",
      });
      console.error("Failed to add friend", error);
    }
  };

  // Remove friend handler
  const handleRemoveFriend = async (friendId: string) => {
    try {
      await deleteFriend(friendId);
      toast({
        title: "成功",
        description: "好友已删除",
        variant: "default",
      });
      setFriends(friends.filter((friend) => friend.id !== friendId));
    } catch (error) {
      toast({
        title: "错误",
        description: "删除好友失败",
        variant: "destructive",
      });
      console.error("Failed to remove friend", error);
    }
  };

  // Toggle follow handler
  const toggleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await cancelFollow(userId);
        toast({
          title: "成功",
          description: "已取消关注",
          variant: "default",
        });
        setFollowing(following.filter((user) => user.id !== userId));
      } else {
        await addFollow(userId);
        toast({
          title: "成功",
          description: "已关注",
          variant: "default",
        });

        // Refresh following list
        const updatedFollowing = await getAllFollowList();
        setFollowing(updatedFollowing?.data || []);
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "切换关注状态失败",
        variant: "destructive",
      });
      console.error("Failed to toggle follow", error);
    }
  };

  // Handle friend request
  const handleRequest = async (applyId: string, accept: boolean) => {
    try {
      await handleFriendRequest(applyId, accept ? 1 : 2);
      toast({
        title: "成功",
        description: accept ? "好友请求已接受" : "好友请求已拒绝",
        variant: "default",
      });

      // Refresh lists
      await fetchAllData();
    } catch (error) {
      toast({
        title: "错误",
        description: "处理好友请求失败",
        variant: "destructive",
      });
      console.error("Failed to handle friend request", error);
    }
  };

  // Render list based on active tab
  const renderList = () => {
    let listToRender: UserWithMutualFriends[] = [];
    let emptyMessage = "No friends found";

    switch (activeTab) {
      case "好友":
        listToRender = friends;
        emptyMessage = "暂无好友";
        break;
      case "好友申请":
        listToRender = receivedRequests;
        emptyMessage = "暂无好友请求";
        break;
      case "我的关注":
        listToRender = following;
        emptyMessage = "暂无关注用户";
        break;
    }

    const safeListToRender = Array.isArray(listToRender) ? listToRender : [];
    const filteredList = searchQuery
      ? safeListToRender.filter(
          (user) =>
            user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : safeListToRender;

    // Additional safety check
    if (!Array.isArray(filteredList)) {
      return <p className="text-gray-500 text-center">加载失败</p>;
    }

    return filteredList.length === 0 ? (
      <p className="text-gray-500 text-center">{emptyMessage}</p>
    ) : (
      filteredList.map(
        (user) =>
          user && (
            <div
              key={user.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-md border"
            >
              <div>
                <p className="text-sm font-medium">
                  {user.name || user.username || "未知"}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email || "未知邮箱"}
                </p>
                {user.mutualFriends !== undefined && (
                  <p className="text-xs text-gray-500">
                    共同好友: {user.mutualFriends}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {activeTab === "好友" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFriend(user.id)}
                  >
                    <UserMinus className="mr-2 h-4 w-4" /> 删除好友
                  </Button>
                )}
                {activeTab === "好友申请" && (
                  <>
                    {receiveRequestStatus === 0 ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleRequest(user.id, true)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" /> 同意
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRequest(user.id, false)}
                        >
                          <UserX className="mr-2 h-4 w-4" /> 拒绝
                        </Button>
                      </>
                    ) : receiveRequestStatus === 1 ? (
                      <p className="text-sm text-green-500">已同意</p>
                    ) : receiveRequestStatus === 2 ? (
                      <p className="text-sm text-red-500">已拒绝</p>
                    ) : (
                      <p className="text-sm text-gray-500">暂无好友申请</p>
                    )}
                  </>
                )}
                {activeTab === "我的关注" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFollow(user.id, true)}
                  >
                    取消关注
                  </Button>
                )}
              </div>
            </div>
          ),
      )
    );
  };

  // Render user search section
  const renderUserSearchSection = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="输入好友邮箱..."
          value={newFriendEmail}
          onChange={(e) => {
            setNewFriendEmail(e.target.value);
            setFoundUser(null); // Reset found user when email changes
          }}
          className="flex-1"
        />
        <Button
          onClick={handleSearchUserByEmail}
          disabled={!newFriendEmail.trim() || isSearching}
        >
          <Search className="mr-2 h-4 w-4" /> 查找用户
        </Button>
      </div>

      {/* User Info Display */}
      {foundUser && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md border">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage
                src={undefined}
                alt={foundUser.username || "User Avatar"}
              />
              <AvatarFallback>
                {foundUser.username ? foundUser.username : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {foundUser.username || "未知用户"}
              </p>
              <p className="text-xs text-gray-500">{foundUser.email}</p>
            </div>
          </div>
          <Button onClick={handleAddFriend} disabled={!foundUser}>
            <UserPlus className="mr-2 h-4 w-4" /> 添加好友
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-6 w-6" />
            我的好友
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <div className="flex space-x-4 mb-4">
            {["好友", "好友申请", "我的关注"].map((tab) => (
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

          {/* Add Friend (only visible on Friends tab) */}
          {activeTab === "好友" && renderUserSearchSection()}

          {/* Search */}
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder={`通过邮件搜索 ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" /> 搜索
            </Button>
          </div>

          {/* Friends List */}
          <div className="space-y-4">{renderList()}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsPage;
