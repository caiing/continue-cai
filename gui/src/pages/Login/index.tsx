import React, { useState } from "react";
import styles from "./Login.module.css";
import ContinueLogo from "../../components/svg/ContinueLogo";

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
    try {
      const success = await loginAction();
      if (success) {
        // 登录成功，执行回调
        onLogin?.();
      } else {
        // 登录失败，显示提示
        setError("登录失败，请检查网络或重试。");
      }
    } catch (e: any) {
      // 捕获并显示异常信息
      setError(e.message || "登录过程中发生错误，请重试。");
    } finally {
      // 无论成功失败，重置加载状态
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部 Logo 区域 */}
      <div className={styles.logoWrapper}>
        <div className={styles.logo}>
          <ContinueLogo width={120} height={40} color="#333" />
        </div>
      </div>

      {/* 中部功能介绍区域 */}
      <div className={styles.contentWrapper}>
        <h1 className={styles.description}>
          Continue 是领先的开源 AI 代码助手，
          <br />
          帮助您更快地编写、重构和理解代码。
        </h1>
      </div>

      {/* 底部登录按钮区域 */}
      <div className={styles.buttonWrapper}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button
            className={styles.loginButton}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading && <div className={styles.spinner} data-testid="loading-spinner" />}
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
