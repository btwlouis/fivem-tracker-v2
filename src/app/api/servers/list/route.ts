import { getServerListPage } from "@/lib/server-list-query";
import type { SortOption } from "@/lib/server-list-types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale");
  const parsedPage = parseInt(searchParams.get("page") || "1", 10);
  const parsedPageSize = parseInt(searchParams.get("pageSize") || "30", 10);
  const page = Math.max(Number.isNaN(parsedPage) ? 1 : parsedPage, 1);
  const pageSize = Math.min(
    Math.max(Number.isNaN(parsedPageSize) ? 30 : parsedPageSize, 1),
    100
  );
  const search = searchParams.get("search") || "";
  const sort = (searchParams.get("sort") || "players") as SortOption;

  try {
    const isDefaultQuery = !search && page === 1 && !locale;
    const cacheControl = isDefaultQuery
      ? "public, s-maxage=30, stale-while-revalidate=60"
      : "no-store";
    const data = await getServerListPage({
      locale,
      page,
      pageSize,
      search,
      sort,
    });

    return NextResponse.json(
      data,
      {
        headers: { "Cache-Control": cacheControl },
      }
    );
  } catch (error) {
    console.error("Failed to fetch servers:", error);
    return NextResponse.json(
      {
        servers: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasMore: false,
        error: "Failed to fetch servers",
      },
      { status: 500 }
    );
  }
}
