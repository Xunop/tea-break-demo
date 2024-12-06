"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import {
  registerUser,
  getImageVerificationCode,
  sendEmailVerificationCode,
} from "@/lib/apis/global";
import type { User } from "@/lib/apis/types";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageCode, setImageCode] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageCodeSrc, setImageCodeSrc] = useState("");
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [emailCodeCountdown, setEmailCodeCountdown] = useState(0);
  const router = useRouter();

  // Fetch image captcha
  const fetchImageCode = async (email: string) => {
    try {
      // Validate email first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        setError("请输入邮箱");
        return;
      }
      if (!emailRegex.test(email)) {
        setError("邮箱格式不正确");
        return;
      }

      getImageVerificationCode(email).then((res) => {
        if (res.data.code !== 200) {
          setError(res.data.message);
          return;
        }
        setImageCodeSrc(res.data.data);
        setError("");
      });
    } catch (err) {
      console.error("Failed to fetch image code", err);
      setError("加载验证码失败，请重试");
    }
  };

  // Countdown timer for email verification code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCodeCountdown > 0) {
      timer = setInterval(() => {
        setEmailCodeCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailCodeCountdown]);

  // Send email verification code
  const handleSendEmailCode = async () => {
    // Validate email first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("邮箱格式不正确");
      return;
    }

    if (!imageCode.trim()) {
      setError("请输入图片验证码");
      return;
    }

    try {
      setIsLoading(true);
      sendEmailVerificationCode(
        email,
        imageCode,
        "tea break 用户注册",
        "",
      ).then((res) => {
        if (res.data.code !== 200) {
          setError(res.data.message);
          return;
        } else {
          setIsEmailCodeSent(true);
          setEmailCodeCountdown(60);
          setError("");
        }
      });
    } catch (err) {
      console.error("Failed to send email code", err);
      setError("发送邮件验证码失败，请重试");
      // Refresh image code on failure
      fetchImageCode(email);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!username.trim()) {
      setError("请输入用户名");
      return false;
    }

    if (username.length < 6) {
      setError("用户名至少需要6个字符");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError("请输入邮箱");
      return false;
    }
    if (!emailRegex.test(email)) {
      setError("邮箱格式不正确");
      return false;
    }

    if (password.length < 8) {
      setError("密码至少需要8个字符");
      return false;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return false;
    }

    if (!imageCode.trim()) {
      setError("请输入图片验证码");
      return false;
    }

    if (!emailVerificationCode.trim()) {
      setError("请输入邮件验证码");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const user: User = {
        username,
        email,
        password,
      };
      registerUser(user, emailVerificationCode).then((res) => {
        if (res.data.code !== 200) {
          setError(res.data.message);
          return;
        } else {
          router.push("/login");
        }
      });
    } catch (err) {
      console.error("Registration error", err);
      setError("注册失败，请重试");
      // Refresh image code on failure
      getImageVerificationCode(email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4 w-full">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader>
          <CardTitle>注册账号</CardTitle>
          <CardDescription>注册账号以开始</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                用户名
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入您的用户名"
                className="w-full"
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                邮箱
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入您的邮箱"
                className="w-full"
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                密码
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入您的密码"
                  className="w-full pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                确认密码
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入您的密码"
                  className="w-full pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="image-code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                图片验证码
              </label>
              <div className="flex items-center space-x-2">
                {imageCodeSrc && (
                  <img
                    src={imageCodeSrc}
                    alt="Verification Code"
                    className="h-10 flex-shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => fetchImageCode(email)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  <RefreshCw size={20} />
                </button>
                <Input
                  id="image-code"
                  type="text"
                  value={imageCode}
                  onChange={(e) => setImageCode(e.target.value)}
                  placeholder="输入图片验证码"
                  className="flex-grow"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="email-code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                邮箱验证码
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  id="email-code"
                  type="text"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  placeholder="请输入邮箱验证码"
                  className="flex-grow"
                  disabled={isLoading || !isEmailCodeSent}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendEmailCode}
                  disabled={isLoading || emailCodeCountdown > 0}
                >
                  {emailCodeCountdown > 0
                    ? `Resend (${emailCodeCountdown}s)`
                    : "Send Code"}
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "注册中" : "注册账号"}
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                已经有账号了？{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  登录
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
