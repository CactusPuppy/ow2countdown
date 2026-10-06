import { SUPABASE_TABLE_NAME } from "$env/static/private";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { handleCORS, setCacheControl } from "../../apiHeaders";

export const GET: RequestHandler = async (request) => {
  const { params, setHeaders, request: originalRequest } = request;
  const { supabase } = request.locals;
  const { data, error: err } = await supabase
    .from(SUPABASE_TABLE_NAME)
    .select("*")
    .eq("id", params.id);

  if (err) throw error(500, "Database error");

  let responseHeaders = setCacheControl();
  responseHeaders = handleCORS(originalRequest, responseHeaders);
  setHeaders(responseHeaders);

  if (data.length <= 0) throw error(404, "Not found");

  return json(data[0]);
};
