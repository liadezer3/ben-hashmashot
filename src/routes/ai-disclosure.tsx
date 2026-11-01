import { createFileRoute } from "@tanstack/react-router";
import AIDisclosure from "@/pages/AIDisclosure";

export const Route = createFileRoute("/ai-disclosure")({
  component: AIDisclosure,
});
