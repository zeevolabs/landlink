import { describe, expect, it } from "vitest";
import { checkPassword } from "./auth";

function makeRequest(password?: string): Request {
  const headers = new Headers();
  if (password) headers.set("x-admin-password", password);
  return new Request("http://localhost", { headers });
}

describe("checkPassword", () => {
  it("returns ok when password matches", () => {
    expect(checkPassword(makeRequest("secret"), "secret")).toEqual({ ok: true });
  });

  it("returns not ok when password does not match", () => {
    expect(checkPassword(makeRequest("wrong"), "secret")).toEqual({ ok: false });
  });

  it("returns not ok when no header is provided", () => {
    expect(checkPassword(makeRequest(), "secret")).toEqual({ ok: false });
  });

  it("returns not ok when server password is undefined", () => {
    expect(checkPassword(makeRequest("anything"), undefined)).toEqual({ ok: false });
  });
});
