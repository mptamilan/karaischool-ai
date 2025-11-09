import { User } from "@shared/api";

let users: User[] = [];
let nextUserId = 1;

export async function findOrCreateUserFromGoogle(info: {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}): Promise<User> {
  let user = users.find(u => u.google_sub === info.sub || (info.email && u.email === info.email));

  if (user) {
    return user;
  }

  const newUser: User = {
    id: nextUserId++,
    google_sub: info.sub,
    name: info.name || null,
    email: info.email || null,
    picture: info.picture || null,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  return newUser;
}

export async function getUserById(id: number): Promise<User | null> {
  const user = users.find(u => u.id === id);
  return user || null;
}

// No-op export to maintain import compatibility
export default {};
