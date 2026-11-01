import { createFileRoute } from "@tanstack/react-router";
import Widget from "@/pages/Widget";

export const Route = createFileRoute("/widget")({
  component: Widget,
});
