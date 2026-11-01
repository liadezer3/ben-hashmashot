import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/whatsapp-shabbat")({
  component: Landing,
});
