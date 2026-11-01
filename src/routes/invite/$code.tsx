import { createFileRoute } from "@tanstack/react-router";
import InvitePage from "@/pages/InvitePage";

export const Route = createFileRoute("/invite/$code")({
  component: InvitePage,
});
