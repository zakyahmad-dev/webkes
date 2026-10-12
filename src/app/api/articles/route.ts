import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q")?.toLowerCase();

    const list = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
        coverPath: articles.coverPath,
        category: articles.category,
        readTimeMinutes: articles.readTimeMinutes,
        publishedAt: articles.publishedAt,
        authorName: users.name,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt));

    let filtered = list;
    if (category && category !== "Semua") {
      filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    if (query) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
