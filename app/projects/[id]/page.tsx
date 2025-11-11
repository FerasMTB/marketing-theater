"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProject } from "../../../lib/api";

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState<string>("");
  useEffect(() => {
    getProject(id).then((p) => setName(p?.name || "Project"));
  }, [id]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{name}</h1>
        <p className="text-sm text-gray-600">Overview and quick actions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Inputs" desc="Provide brand and strategy inputs" href={`/projects/${id}/inputs/brand`} cta="Complete Inputs" />
        <Card title="Review" desc="Preview brand and strategy summary" href={`/projects/${id}/review`} cta="Review & Confirm" />
        <Card title="Run" desc="Run phases and stream results" href={`/projects/${id}/run`} cta="Open Run" />
        <Card title="Calendar" desc="See the day-by-day plan" href={`/projects/${id}/calendar`} cta="View Calendar" />
      </div>
    </div>
  );
}

function Card({ title, desc, href, cta }: { title: string; desc: string; href: string; cta: string }) {
  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
      <div className="pt-4">
        <Link href={href} className="inline-flex items-center rounded bg-black text-white px-3 py-2 text-sm">
          {cta}
        </Link>
      </div>
    </div>
  );
}

