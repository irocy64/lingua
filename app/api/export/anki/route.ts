import { buildAnkiTsv } from "@/server/export";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") as "en" | "ja" | null;
  const tsv = await buildAnkiTsv(session.user.id, lang ?? undefined);

  return new Response(tsv, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename="lingua-anki${lang ? "-" + lang : ""}.tsv"`,
    },
  });
}
