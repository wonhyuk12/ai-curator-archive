import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MindMapView } from "@/components/mindmap/MindMapView";
import { ARCHIVE, getCategory } from "@/data/archive";

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCHIVE.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  return { title: c ? `${c.name} — AI ARCHIVE` : "AI ARCHIVE" };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  if (!getCategory(category)) notFound();
  return <MindMapView key={category} slug={category} />;
}
