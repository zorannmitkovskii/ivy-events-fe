import apiPublic from "./backendApi";

export function isAuthenticated() {
  return !!localStorage.getItem("access_token");
}

// Register new user via public endpoint
// payload: { email, password, firstName, lastName, ... }
export async function register(payload) {
  // BE expects CreateUserRequest at /public/users/register
  const res = await apiPublic.post("/public/users/register", payload);
  return res?.data || res; // backendApi returns AxiosResponse; normalize
}

// Verify email with code
export async function verifyEmail(code, email) {
  const body = { code, email };
  const res = await apiPublic.post("/public/auth/verify-email", body);
  return res?.data || res;
}
