"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Todos", href: "/" },
  { name: "Nacionais", href: "/categoria/nacionais" },
  { name: "Internacionais", href: "/categoria/internacionais" },
  { name: "Selecoes", href: "/categoria/selecoes" },
];

export function CategoryTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {categories.map((category) => {
        const isActive =
          category.href === "/"
            ? pathname === "/"
            : pathname.startsWith(category.href);

        return (
          <Link
            key={category.href}
            href={category.href}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-primary hover:text-primary"
            )}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
