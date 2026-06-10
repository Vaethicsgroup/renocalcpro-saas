export async function auth() {
  return {
    user: {
      id: "dev-user",
      name: "Dev User",
      email: "dev@renocalcpro.local",
      role: "admin"
    }
  };
}
