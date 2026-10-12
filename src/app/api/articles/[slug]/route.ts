import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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
      .where(eq(articles.slug, slug))
      .limit(1);

    if (list.length === 0) {
      return NextResponse.json({ success: false, message: "Artikel tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: list[0] });
  } catch (error: any) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
