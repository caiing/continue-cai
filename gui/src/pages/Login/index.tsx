import React, { useState } from "react";
import styles from "./Login.module.css";

/**
 * 登录页面组件属性接口
 */
interface LoginProps {
  /**
   * 登录成功后的回调函数
   */
  onLogin?: () => void;
  /**
   * 登录处理函数，返回是否登录成功
   */
  loginAction: () => Promise<boolean>;
}

/**
 * 全屏登录页面组件
 * 包含产品 Logo、功能介绍和登录按钮
 */
const Login: React.FC<LoginProps> = ({ onLogin, loginAction }) => {
  // 登录加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 登录错误信息
  const [error, setError] = useState<string | null>(null);

  /**
   * 处理登录按钮点击事件
   */
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    // 设置 30 秒超时兜底，防止按钮永久卡死
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError("Login timed out, please try again.");
      }
    }, 30000);

    try {
      const success = await loginAction();
      clearTimeout(timeoutId);
      if (success) {
        // 登录成功，执行回调
        onLogin?.();
      } else {
        // 登录未成功（可能是用户取消），静默重置状态，不显示错误
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      // 仅在发生真实异常时显示错误（排除 VS Code 身份验证取消的情况）
      const errorMessage = e.message || String(e);
      if (
        !errorMessage.includes("User cancelled") &&
        !errorMessage.includes("Cancelled by user")
      ) {
        setError("An error occurred during login, please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      // 无论成功失败，重置加载状态
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部 Logo 区域 */}
      <div className={styles.logoWrapper}>
        <div className={styles.logo}>
          <img
            src={(window as any).vscIconUrl}
            alt="Logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>

      {/* 中部功能介绍区域 */}
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>欢迎使用 Continue</h2>
        <p className={styles.description}>
          Continue 是您的开源 AI 编程助手。
          <br />
          登录以开始使用聊天、补全和代码编辑功能。
        </p>
      </div>

      {/* 底部登录按钮区域 */}
      <div className={styles.buttonWrapper}>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <button
            className={styles.loginButton}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading && (
              <div className={styles.spinner} data-testid="loading-spinner" />
            )}
            {isLoading ? "登录中..." : "登录"}
          </button>
          {/* 错误信息提示 */}
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
