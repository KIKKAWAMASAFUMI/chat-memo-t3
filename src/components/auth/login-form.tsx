"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  User,
} from "lucide-react";

type AuthMode = "login" | "signup" | "forgot-password";
type PasswordStrength = "weak" | "medium" | "strong";

function checkPasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
  requirements: { label: string; met: boolean }[];
} {
  const requirements = [
    { label: "8文字以上", met: password.length >= 8 },
    { label: "英字を含む", met: /[a-zA-Z]/.test(password) },
    { label: "数字を含む", met: /\d/.test(password) },
    {
      label: "記号を含む",
      met: /[!@#$%^&*(),.?":{}|<>\-_/\\[\];'~`+=]/.test(password),
    },
    { label: "大文字を含む", met: /[A-Z]/.test(password) },
  ];

  const score = requirements.filter((r) => r.met).length;

  let strength: PasswordStrength = "weak";
  if (score >= 4) strength = "strong";
  else if (score >= 3) strength = "medium";

  return { strength, score, requirements };
}

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = checkPasswordStrength(password);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === "forgot-password") {
      if (!email) {
        setError("メールアドレスを入力してください");
        return;
      }
      // TODO: Implement password reset
      setSuccessMessage("パスワードリセットのメールを送信しました");
      return;
    }

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("パスワードは8文字以上で入力してください");
        return;
      }
      if (!/[a-zA-Z]/.test(password)) {
        setError("パスワードには英字を含めてください");
        return;
      }
      if (!/\d/.test(password)) {
        setError("パスワードには数字を含めてください");
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>\-_/\\[\];'~`+=]/.test(password)) {
        setError("パスワードには記号（-_!@#$%など）を含めてください");
        return;
      }
      if (password !== confirmPassword) {
        setError("パスワードが一致しません");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("メールアドレスまたはパスワードが正しくありません");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        // Signup - call API to create user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name || undefined, email, password }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          setError(data.error ?? "登録に失敗しました");
        } else {
          setSuccessMessage("アカウントが作成されました。ログインしてください。");
          setMode("login");
        }
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    }

    setIsSubmitting(false);
  };

  const handleGoogleAuth = async () => {
    setError(null);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Memo</h1>
          <p className="text-gray-500 mt-1">
            {mode === "login" && "ログインして始めましょう"}
            {mode === "signup" && "アカウントを作成"}
            {mode === "forgot-password" && "パスワードをリセット"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                size={18}
                className="text-red-500 mt-0.5 shrink-0"
              />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Google Sign In */}
          {mode !== "forgot-password" && (
            <>
              <button
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでログイン
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">または</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Name (Signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ユーザー名
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="表示名を入力"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                メールアドレス
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== "forgot-password" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  パスワード
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8文字以上（英字+数字+記号）"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator (Signup only) */}
                {mode === "signup" && password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            passwordStrength.score >= level
                              ? passwordStrength.strength === "strong"
                                ? "bg-green-500"
                                : passwordStrength.strength === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-red-400"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span
                        className={`font-medium ${
                          passwordStrength.strength === "strong"
                            ? "text-green-600"
                            : passwordStrength.strength === "medium"
                              ? "text-yellow-600"
                              : "text-red-500"
                        }`}
                      >
                        {passwordStrength.strength === "strong" && "強い"}
                        {passwordStrength.strength === "medium" && "普通"}
                        {passwordStrength.strength === "weak" && "弱い"}
                      </span>
                      <span className="text-gray-400">
                        {passwordStrength.requirements.filter((r) => r.met).length}/5
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {passwordStrength.requirements.slice(0, 4).map((req) => (
                        <span
                          key={req.label}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            req.met
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {req.met ? "✓" : "○"} {req.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password (Signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  パスワード（確認）
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードを再入力"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot-password");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-sm text-orange-500 hover:underline"
                >
                  パスワードをお忘れですか？
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {mode === "login" && "ログイン"}
                  {mode === "signup" && "アカウント作成"}
                  {mode === "forgot-password" && "リセットメールを送信"}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {mode === "login" && (
              <>
                アカウントをお持ちでないですか？{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-orange-500 font-medium hover:underline"
                >
                  新規登録
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                既にアカウントをお持ちですか？{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-orange-500 font-medium hover:underline"
                >
                  ログイン
                </button>
              </>
            )}
            {mode === "forgot-password" && (
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-orange-500 font-medium hover:underline"
              >
                ログインに戻る
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Chat Memo. All rights reserved.
        </p>
      </div>
    </div>
  );
}
