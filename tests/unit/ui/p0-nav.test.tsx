import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainNav } from "@/components/p0/nav/main-nav";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("P0 navigation", () => {
  it("renders 任务中心", () => {
    render(<MainNav />);

    expect(screen.getAllByRole("link", { name: "任务中心" }).length).toBeGreaterThan(0);
  });

  it("renders 排行榜", () => {
    render(<MainNav />);

    expect(screen.getAllByRole("link", { name: "排行榜" }).length).toBeGreaterThan(0);
  });

  it("renders all top-level nav items", () => {
    render(<MainNav />);

    expect(screen.getAllByRole("link", { name: "首页" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "任务中心" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "排行榜" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "认证中心" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Agent 市场" }).length).toBeGreaterThan(0);
  });

  it("toggles mobile menu aria-expanded", () => {
    render(<MainNav />);

    const openButton = screen.getAllByRole("button", { name: "打开主导航" })[0];
    expect(openButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(openButton);

    const closeButton = screen.getAllByRole("button", { name: "关闭主导航" })[0];
    expect(closeButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(closeButton);

    expect(screen.getAllByRole("button", { name: "打开主导航" })[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu when pathname changes", () => {
    const { rerender } = render(<MainNav />);

    fireEvent.click(screen.getAllByRole("button", { name: "打开主导航" })[0]);
    expect(screen.getAllByRole("button", { name: "关闭主导航" })[0]).toHaveAttribute("aria-expanded", "true");

    pathname = "/tasks";
    rerender(<MainNav />);

    expect(screen.getAllByRole("button", { name: "打开主导航" })[0]).toHaveAttribute("aria-expanded", "false");
    pathname = "/";
  });
});
