import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/server/account";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "密码至少 6 位"),
  nickname: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "输入无效" },
      { status: 400 }
    );
  }

  try {
    const user = await registerUser(
      parsed.data.email,
      parsed.data.password,
      parsed.data.nickname
    );
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 409 }
    );
  }
}
