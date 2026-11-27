import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";

const creds = (n: string) => ({ username: n, email: `${n}@example.com`, password: "correct-horse-battery" });

async function signUp(n: string) {
  await request(app).post("/v1/auth/register").send(creds(n)).expect(201);
  const res = await request(app).post("/v1/auth/login").send({ username: n, password: creds(n).password }).expect(200);
  return { token: res.body.token as string, userId: res.body.userId as string };
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe("health and CORS", () => {
  it("GET /v1/health returns ok without a database call", async () => {
    const res = await request(app).get("/v1/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });
  it("allows the GitHub Pages origin and answers preflight", async () => {
    const res = await request(app).options("/v1/shelf").set("Origin", "https://anusha267.github.io").expect(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://anusha267.github.io");
  });
  it("does not allow unknown origins", async () => {
    const res = await request(app).get("/v1/health").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("auth", () => {
  it("registers, then logs in by username and by email", async () => {
    await request(app).post("/v1/auth/register").send(creds("alice")).expect(201);
    const byName = await request(app).post("/v1/auth/login").send({ username: "alice", password: creds("alice").password }).expect(200);
    const byMail = await request(app).post("/v1/auth/login").send({ email: "alice@example.com", password: creds("alice").password }).expect(200);
    expect(byName.body.token).toBeTruthy();
    expect(byMail.body.userId).toBe(byName.body.userId);
  });
  it("never stores or returns the plain password or hash", async () => {
    await request(app).post("/v1/auth/register").send(creds("bob")).expect(201);
    const res = await request(app).post("/v1/auth/login").send({ username: "bob", password: creds("bob").password }).expect(200);
    const payload: any = jwt.decode(res.body.token);
    expect(payload.user_details.password_hash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("correct-horse");
  });
  it("rejects a wrong password and unknown user with the same 401", async () => {
    await request(app).post("/v1/auth/register").send(creds("carol")).expect(201);
    const wrong = await request(app).post("/v1/auth/login").send({ username: "carol", password: "nope" }).expect(401);
    const none = await request(app).post("/v1/auth/login").send({ username: "ghost", password: "nope" }).expect(401);
    expect(wrong.body).toEqual(none.body);
  });
  it("rejects duplicate email and duplicate username with 400", async () => {
    await request(app).post("/v1/auth/register").send(creds("dave")).expect(201);
    await request(app).post("/v1/auth/register").send({ ...creds("dave"), username: "dave2" }).expect(400);
    await request(app).post("/v1/auth/register").send({ ...creds("dave"), email: "other@example.com" }).expect(400);
  });
  it("issues a token that expires in about an hour", async () => {
    const { token } = await signUp("erin");
    const p: any = jwt.decode(token);
    expect(p.exp - p.iat).toBe(3600);
  });
});

describe("JWT middleware", () => {
  it("returns 401 with no token on protected routes", async () => {
    await request(app).get("/v1/shelf").expect(401);
    await request(app).post("/v1/books").send({}).expect(401);
  });
  it("returns 403 for a bad token and for a token signed with another secret", async () => {
    await request(app).get("/v1/shelf").set(auth("garbage")).expect(403);
    const forged = jwt.sign({ user_details: { user_id: "x" } }, "other-secret");
    await request(app).get("/v1/shelf").set(auth(forged)).expect(403);
  });
  it("rejects an expired token", async () => {
    const expired = jwt.sign({ user_details: { user_id: "x" } }, process.env.BOOKENZY_JWT_SECRET!, { expiresIn: -10 });
    await request(app).get("/v1/shelf").set(auth(expired)).expect(403);
  });
  it("rejects an unsigned (alg none) token", async () => {
    const b = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const none = `${b({ alg: "none", typ: "JWT" })}.${b({ user_details: { user_id: "x" } })}.`;
    await request(app).get("/v1/shelf").set(auth(none)).expect(403);
  });
});

describe("shelf", () => {
  it("creates, lists, updates progress and deletes an item", async () => {
    const { token } = await signUp("fran");
    const created = await request(app).post("/v1/shelf").set(auth(token)).send({ title: " Piranesi ", author: "Susanna Clarke", pages: 272 }).expect(201);
    expect(created.body).toMatchObject({ title: "Piranesi", status: "want", rating: 0, pages: 272, currentPage: 0, finishedAt: null });

    const list = await request(app).get("/v1/shelf").set(auth(token)).expect(200);
    expect(list.body.items).toHaveLength(1);

    const reading = await request(app).patch(`/v1/shelf/${created.body.id}`).set(auth(token)).send({ status: "reading", currentPage: 40 }).expect(200);
    expect(reading.body).toMatchObject({ status: "reading", currentPage: 40, finishedAt: null });

    const done = await request(app).patch(`/v1/shelf/${created.body.id}`).set(auth(token)).send({ status: "finished", rating: 5 }).expect(200);
    expect(done.body.finishedAt).toBeTruthy();
    expect(done.body.rating).toBe(5);

    const back = await request(app).patch(`/v1/shelf/${created.body.id}`).set(auth(token)).send({ status: "reading" }).expect(200);
    expect(back.body.finishedAt).toBeNull();

    await request(app).delete(`/v1/shelf/${created.body.id}`).set(auth(token)).expect(204);
    await request(app).delete(`/v1/shelf/${created.body.id}`).set(auth(token)).expect(404);
  });
  it("validates input", async () => {
    const { token } = await signUp("gina");
    const post = (b: object) => request(app).post("/v1/shelf").set(auth(token)).send(b);
    await post({ author: "x" }).expect(400);
    await post({ title: "x", author: "  " }).expect(400);
    await post({ title: "x", author: "y", status: "bogus" }).expect(400);
    await post({ title: "x", author: "y", rating: 6 }).expect(400);
    const item = await post({ title: "x", author: "y" }).expect(201);
    const patch = (b: object) => request(app).patch(`/v1/shelf/${item.body.id}`).set(auth(token)).send(b);
    await patch({ status: "bogus" }).expect(400);
    await patch({ rating: -1 }).expect(400);
    await patch({ currentPage: 1.5 }).expect(400);
    await patch({ currentPage: 100001 }).expect(400);
    await request(app).patch("/v1/shelf/not-a-uuid").set(auth(token)).send({ rating: 1 }).expect(404);
  });
  it("isolates users: nobody can read, change or delete another user's items", async () => {
    const a = await signUp("hank");
    const b = await signUp("iris");
    const item = await request(app).post("/v1/shelf").set(auth(a.token)).send({ title: "Mine", author: "A" }).expect(201);
    const bList = await request(app).get("/v1/shelf").set(auth(b.token)).expect(200);
    expect(bList.body.items).toHaveLength(0);
    await request(app).patch(`/v1/shelf/${item.body.id}`).set(auth(b.token)).send({ rating: 1 }).expect(404);
    await request(app).delete(`/v1/shelf/${item.body.id}`).set(auth(b.token)).expect(404);
    const still = await request(app).get("/v1/shelf").set(auth(a.token)).expect(200);
    expect(still.body.items[0]).toMatchObject({ title: "Mine", rating: 0 });
  });
  it("treats SQL metacharacters in text as data", async () => {
    const { token } = await signUp("jo");
    const title = "x'); DROP TABLE shelf_items; --";
    await request(app).post("/v1/shelf").set(auth(token)).send({ title, author: "y" }).expect(201);
    const list = await request(app).get("/v1/shelf").set(auth(token)).expect(200);
    expect(list.body.items[0].title).toBe(title);
  });
});
