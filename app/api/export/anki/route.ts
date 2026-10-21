import { buildAnkiTsv } from "@/server/export";
import { getActiveApiUser } from "@/lib/access";

export async function GET(request: Request) {
  const user = await getActiveApiUser();
  if (!user) {
    return new Response("unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") as "en" | "ja" | null;
  const tsv = await buildAnkiTsv(user.id, lang ?? undefined);

  return new Response(tsv, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename="lingua-anki${lang ? "-" + lang : ""}.tsv"`,
    },
  });
}
