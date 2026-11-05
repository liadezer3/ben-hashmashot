import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarMenu } from "./HamburgerMenu";

vi.mock("@/lib/router-compat", () => ({
  useLocation: () => ({ pathname: "/" }),
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signOut: vi.fn() } } }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

afterEach(cleanup);

describe("Homepage tool menu actions", () => {
  it("activates departure and closes the menu instead of navigating home", () => {
    const onSelectTool = vi.fn();
    const onClose = vi.fn();
    render(<SidebarMenu onSelectTool={onSelectTool} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /חלון יציאה/ }));
    expect(onSelectTool).toHaveBeenCalledExactlyOnceWith("departure");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("activates concierge and closes the menu instead of navigating home", () => {
    const onSelectTool = vi.fn();
    const onClose = vi.fn();
    render(<SidebarMenu onSelectTool={onSelectTool} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /קונסיירז/ }));
    expect(onSelectTool).toHaveBeenCalledExactlyOnceWith("concierge");
    expect(onClose).toHaveBeenCalledOnce();
  });
});