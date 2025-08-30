export async function GET() {
  const key = process.env.YOUTUBE_API_KEY || "";
  return Response.json({ hasKey: !!key, keyLength: key.length });
}