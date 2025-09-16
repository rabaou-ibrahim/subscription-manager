import { json } from "./http";

const BASE = "/api/space";

const auth = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export function listSpaces(token) {
  return json(`${BASE}/all`, { headers: auth(token) });
}

export function createSpace({ name, visibility, description = null, logo = "default.png" }, token) {
  return json(`${BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth(token) },
    body: JSON.stringify({ name, visibility, description, logo }),
  });
}

export function getSpace(id, token) {
  return json(`${BASE}/${id}`, { headers: auth(token) });
}

export function archiveSpace(id, token) {
  return json(`${BASE}/archive/${id}`, { method: "PATCH", headers: auth(token) });
}

export function deleteSpace(id, token) {
  return json(`${BASE}/delete/${id}`, { method: "DELETE", headers: auth(token) });
}

export async function ensurePersonalSpaceAndMember(token, user) {
  // 1) ai-je déjà un espace ?
  const spacesRaw = await listSpaces(token);
  const spaces = Array.isArray(spacesRaw) ? spacesRaw : (spacesRaw?.items ?? []);
  let mine = spaces.find(
    (s) =>
      s.owner?.id === user?.id ||
      s.owner_id === user?.id ||
      s.my_member_id ||
      s.members?.some?.((m) => m?.user?.id === user?.id || m?.is_me)
  );

  if (mine) {
    let memberId =
      mine.my_member_id ||
      mine.meMemberId ||
      mine.members?.find?.((m) => m?.user?.id === user?.id || m?.is_me)?.id;

    if (!memberId) {
      const memRaw = await listMembers(token);
      const mems = Array.isArray(memRaw) ? memRaw : (memRaw?.items ?? []);
      memberId = mems.find(
        (m) =>
          (m?.space?.id ?? m?.space_id) === mine.id &&
          (m?.user?.id === user?.id || m?.is_me)
      )?.id;
    }
    return { spaceId: mine.id, memberId: memberId ?? null };
  }

  // 2) sinon, je crée un espace
  const spaceName = user?.firstname ? `${user.firstname} – perso` : "Mon espace";
  const created = await createSpace({ name: spaceName }, token);
  const spaceId = created?.id || created?.space?.id;

  // 3) et j’y crée/repère mon member
  let memberId = null;
  try {
    const mk = await createMember({ space_id: spaceId, user_id: user?.id }, token);
    memberId = mk?.id || mk?.member?.id || null;
  } catch {}
  if (!memberId) {
    const memRaw = await listMembers(token);
    const mems = Array.isArray(memRaw) ? memRaw : (memRaw?.items ?? []);
    memberId = mems.find(
      (m) =>
        (m?.space?.id ?? m?.space_id) === spaceId &&
        (m?.user?.id === user?.id || m?.is_me)
    )?.id;
  }
  return { spaceId, memberId: memberId ?? null };
}
