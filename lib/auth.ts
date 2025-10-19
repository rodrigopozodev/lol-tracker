export async function login(email: string, password: string) {
  return { token: "demo-token", email };
}
export async function register(data: { email: string; password: string; name?: string }) {
  return { id: "demo-user", ...data };
}
