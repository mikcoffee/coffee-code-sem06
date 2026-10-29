// API access layer: the only file that knows the API address and uses fetch.
export const API_URL = "http://127.0.0.1:8000";

/** The API did not respond: it is off, the address is wrong, or the browser blocked it (CORS). */
export class NetworkError extends Error {
  constructor() {
    super("Could not talk to the API. Is it running?");
    this.name = "NetworkError";
  }
}

/** The API responded, but with an error code (400, 404, 409, 422, 500...). */
export class HttpError extends Error {
  constructor(status, body) {
    super(`The API responded with ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new NetworkError();
  }
  // 204 has no body: calling .json() on it would fail.
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  // fetch does NOT reject on 404 or 500: we must check response.ok.
  if (!response.ok) throw new HttpError(response.status, data);
  return { data, response };
}

export async function listSubjects() {
  return (await request("/subjects")).data;
}

export async function listGroups({ search = "", subjectId = "", limit = 4, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (search) params.set("search", search);
  if (subjectId) params.set("subject_id", subjectId);
  const { data, response } = await request(`/groups?${params}`);
  const total = response.headers.get("X-Total-Count");
  if (total === null) {
    console.warn("X-Total-Count is not visible. Check expose_headers in the API's CORS.");
  }
  return {
    groups: data,
    total: total === null ? data.length : Number(total),
  };
}

export async function createGroup(body) {
  return (await request("/groups", { method: "POST", body })).data;
}

export async function updateGroup(id, body) {
  return (await request(`/groups/${id}`, { method: "PATCH", body })).data;
}

export async function deleteGroup(id) {
  await request(`/groups/${id}`, { method: "DELETE" });
}
