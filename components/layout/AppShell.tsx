"use client";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { PropsWithChildren } from "react";

const nav = [
  { label: "Overview", path: (id: string) => `/projects/${id}` },
  { label: "Brand", path: (id: string) => `/projects/${id}/inputs/brand` },
  { label: "Strategy", path: (id: string) => `/projects/${id}/inputs/strategy` },
  { label: "Review", path: (id: string) => `/projects/${id}/review` },
  { label: "Run", path: (id: string) => `/projects/${id}/run` },
  { label: "Calendar", path: (id: string) => `/projects/${id}/calendar` },
];

export function AppShell({ children }: PropsWithChildren) {
  const params = useParams<{ id: string }>() as any;
  const pathname = usePathname();
  const id = params?.id;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/projects" className="font-semibold">
            Marketing Theater
          </Link>
          <div className="flex items-center gap-3">
            {id && (
              <nav className="flex gap-4 text-sm">
                {nav.map((n) => {
                  const href = n.path(id);
                  const active = pathname?.startsWith(href);
                  return (
                    <Link
                      key={n.label}
                      href={href}
                      className={`px-2 py-1 rounded ${
                        active
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
            )}
            <Link
              href="/"
              className="text-sm px-3 py-2 rounded border hover:bg-gray-50"
            >
              New Project
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 flex-1">{children}</main>
    </div>
  );
}
