import { redirect, type RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = async () => {
  throw redirect(301, "https://discord.gg/Gesga8VwbK");
}
