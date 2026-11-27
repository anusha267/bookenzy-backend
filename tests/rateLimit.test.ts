import { it, expect } from "vitest";
import request from "supertest";

it("limits repeated auth attempts with 429", async () => {
  process.env.AUTH_RATE_LIMIT = "3";
  const { default: app } = await import("../src/app");
  const codes: number[] = [];
  for (let i = 0; i < 5; i++) {
    const r = await request(app).post("/v1/auth/login").send({ username: "nobody", password: "x" });
    codes.push(r.status);
  }
  expect(codes.slice(0, 3)).toEqual([401, 401, 401]);
  expect(codes.slice(3)).toEqual([429, 429]);
});
