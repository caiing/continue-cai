import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Login from "../index";
import React from "react";

// Mock ContinueLogo since it might contain complex SVG or context dependencies
vi.mock("../../components/svg/ContinueLogo", () => ({
  default: () => <div data-testid="continue-logo">Logo</div>,
}));

describe("Login Component", () => {
  it("应该正确渲染 Logo、介绍文案和登录按钮", () => {
    const loginAction = vi.fn();
    render(<Login onLogin={vi.fn()} loginAction={loginAction} />);

    expect(screen.getByTestId("continue-logo")).toBeInTheDocument();
    expect(screen.getByText(/Continue 是领先的开源 AI 代码助手/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });

  it("点击登录按钮后应切换为加载状态并禁用按钮", async () => {
    // 模拟一个延迟成功的登录操作
    const loginAction = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );
    render(<Login loginAction={loginAction} />);

    const loginButton = screen.getByRole("button", { name: "登录" });
    fireEvent.click(loginButton);

    // 检查加载状态
    expect(screen.getByText("登录中...")).toBeInTheDocument();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(loginButton).toBeDisabled();

    // 等待登录完成
    await waitFor(() => {
      expect(screen.queryByText("登录中...")).not.toBeInTheDocument();
    });
  });

  it("登录成功后应调用 onLogin 回调", async () => {
    const onLogin = vi.fn();
    const loginAction = vi.fn().mockResolvedValue(true);
    render(<Login onLogin={onLogin} loginAction={loginAction} />);

    const loginButton = screen.getByRole("button", { name: "登录" });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledTimes(1);
    });
    expect(loginAction).toHaveBeenCalledTimes(1);
  });

  it("登录失败后应显示错误信息并恢复按钮状态", async () => {
    const loginAction = vi.fn().mockResolvedValue(false);
    render(<Login loginAction={loginAction} />);

    const loginButton = screen.getByRole("button", { name: "登录" });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText("登录失败，请检查网络或重试。")).toBeInTheDocument();
    });

    expect(loginButton).not.toBeDisabled();
    expect(screen.getByText("登录")).toBeInTheDocument();
  });

  it("登录抛出异常时应显示异常信息", async () => {
    const loginAction = vi.fn().mockRejectedValue(new Error("网络异常"));
    render(<Login loginAction={loginAction} />);

    const loginButton = screen.getByRole("button", { name: "登录" });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText("网络异常")).toBeInTheDocument();
    });

    expect(loginButton).not.toBeDisabled();
  });
});
