"use client";

import { Home, Book, Contact, LogOut, LogIn, Shield } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { getCurrentUser, userLogout } from "@/lib/apis/auth";

// Menu items.
const items = [
  {
    title: "主页",
    url: "/",
    icon: Home,
  },
  {
    title: "论文",
    url: "/papers",
    icon: Book,
  },
  {
    title: "好友",
    url: "/friends",
    icon: Contact,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    getCurrentUser()
      .then((response) => {
        // console.log(response)
        if (response.data.code !== 200) {
          console.log("User not found");
          setUser(false);
          setIsAdmin(false);
          return;
        } else {
          setUser(true);
          if (response.data.data.role === 2) {
            setIsAdmin(true);
          }
        }
      })
      .catch(() => {
        setUser(false);
      });
  }, [pathname]);

  const handleAuthAction = () => {
    if (user) {
      // Logout, clear cookie and call userLogout function
      userLogout().then((res) => {
        if (res.data.code !== 200) {
          console.log(res.data.message);
        } else {
          setUser(false);
          console.log("Logged out");
          // router.refresh();
          router.push("/");
        }
      });
    } else {
      // Login
      console.log("Login");
      router.push("/login");
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>应用</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Button
                    onClick={() => router.push(item.url)}
                    className="w-full flex items-start justify-start"
                    variant={pathname === item.url ? "default" : "ghost"}
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{item.title}</span>
                  </Button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            {/* Admin Management Option - Only visible to admins */}
            {user && isAdmin && (
              <SidebarMenuItem>
                <Button
                  onClick={() => router.push("/admin")}
                  className="w-full flex items-start justify-start"
                  variant={pathname === "/admin" ? "default" : "ghost"}
                >
                  <Shield className="w-6 h-6" />
                  <span>管理</span>
                </Button>
              </SidebarMenuItem>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>用户</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* User page */}
            {user && (
              <SidebarMenuItem>
                <Button
                  onClick={() => router.push("/user")}
                  className="w-full flex items-start justify-start"
                  variant={pathname === "/user" ? "default" : "ghost"}
                >
                  <Book className="w-6 h-6" />
                  <span>用户</span>
                </Button>
              </SidebarMenuItem>
            )}
            <Button
              onClick={handleAuthAction}
              className="w-full flex items-center justify-start mt-4"
              variant="ghost"
            >
              {user ? (
                <>
                  <LogOut className="w-6 h-6" />
                  <span>登出</span>
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  <span>登录</span>
                </>
              )}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
