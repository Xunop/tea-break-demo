import { apis } from ".";
import qs from "querystring";

/**
 * Sign in a user
 * @param {string} email - Username of the user
 * @param {string} password - Password of the user
 */
export function signIn(email: string, password: string) {
  return apis.post(
    "/api/Users/UserLogin",
    qs.stringify({ email: email, password }),
  );
}

/**
 * User Logout
 */
export function userLogout()  {
  return apis.post("/api/Users/UserLogout");
}

/**
 * Get the current user
 */
export function getCurrentUser() {
  return apis.get('/api/Users/GetInfo');
}
