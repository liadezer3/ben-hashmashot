import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function ExtrasLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-5 py-10 space-y-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary print:hidden">
          <ArrowRight className="h-4 w-4" /> חזרה לדף הבית
        </Link>
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
