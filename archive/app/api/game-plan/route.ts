import { NextResponse } from "next/server";
import { parseByKeywords, sanitizeIntent, ROLES, type GameIntent } from "@/lib/game-plan";

// 손님이 적은 "만들고 싶은 게임"을 Gemini로 해석해요. 키는 서버에만 있어요 (GEMINI_API_KEY).
// Gemini가 안 되면(키 없음·한도 초과·느림·이상한 답) 키워드로 대신 해석해요.
export const runtime = "nodejs";

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 6000;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    genre: { type: "STRING", description: "게임 장르를 한국어 한두 단어로 (모르면 빈 문자열)" },
    dim: { type: "STRING", enum: ["2d", "3d", "unknown"] },
    codingLevel: { type: "STRING", enum: ["none", "some", "good", "unknown"] },
    needs: { type: "ARRAY", items: { type: "STRING", enum: ROLES } },
  },
  required: ["dim", "codingLevel", "needs"],
};

const INSTRUCTION = `너는 게임 제작 상담 도우미야. 손님이 만들고 싶은 게임을 적은 글을 읽고 JSON만 답해.
- dim: 2D 게임이면 "2d", 3D면 "3d", 알 수 없으면 "unknown"
- codingLevel: 코딩을 모르거나 처음이면 "none", 조금 하면 "some", 잘하면 "good", 언급 없으면 "unknown"
- needs: 이 게임을 만들 때 필요한 일 (code 게임 만들기, art2d 2D 그림, model3d 3D 모델, music 배경음악, sfx 효과음, voice 캐릭터 목소리, story 기획·대사)
게임과 상관없는 글이어도 위 형식으로만 답해.`;

async function askGemini(text: string): Promise<GameIntent | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return out ? sanitizeIntent(JSON.parse(out)) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text.trim().slice(0, 300) : "";
  } catch {
    /* 빈 요청 */
  }
  if (!text) return NextResponse.json({ error: "만들고 싶은 게임을 적어 주세요" }, { status: 400 });

  const fromGemini = await askGemini(text);
  // Gemini 답을 쓰되, 손님이 분명히 적은 키워드(예: "3D", "음악")는 빠지지 않게 합쳐요
  const kw = parseByKeywords(text);
  const intent: GameIntent = fromGemini
    ? {
        genre: fromGemini.genre ?? kw.genre,
        dim: fromGemini.dim !== "unknown" ? fromGemini.dim : kw.dim,
        codingLevel: fromGemini.codingLevel !== "unknown" ? fromGemini.codingLevel : kw.codingLevel,
        // 목소리·대사는 손님이 직접 적었을 때만 (Gemini는 거의 항상 넣어서 네 번째 추천이 늘 대사가 돼요)
        needs: [...new Set([...fromGemini.needs.filter((r) => r !== "voice" && r !== "story"), ...kw.needs])],
      }
    : kw;
  return NextResponse.json({ intent, source: fromGemini ? "gemini" : "keyword" });
}
