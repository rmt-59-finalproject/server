const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const app = require("../../app");
const { hashPassword } = require("../helpers/bcrypt");

let mongoServer;
let connection;
let db;
let access_token;
let refresh_token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  connection = await MongoClient.connect(uri);
  db = connection.db("stockify");

  const originalDb = require("../config/mongodb");
  Object.assign(originalDb, db);

  await db.collection("users").insertOne({
    username: "admin",
    password: hashPassword("12345"),
    name: "Admin Warehouse",
    role: "warehouse",
  });

  const loginRes = await request(app)
    .post("/api/login")
    .send({ username: "admin", password: "12345" });

  const cookies = loginRes.headers["set-cookie"] || [];

  const accessTokenCookie = cookies.find((cookie) =>
    cookie.startsWith("access_token")
  );
  const refreshTokenCookie = cookies.find((cookie) =>
    cookie.startsWith("refresh_token")
  );

  expect(accessTokenCookie).toBeDefined();

  if (accessTokenCookie) {
    access_token = accessTokenCookie.split(";")[0];
  }
  if (refreshTokenCookie) {
    refresh_token = refreshTokenCookie.split(";")[0]; // Simpan refresh_token
  }
});

afterAll(async () => {
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  await db.collection("users").deleteMany({ username: { $ne: "admin" } });
});

describe("GET /api/logout", () => {
  test("Should clear cookies and return success message", async () => {
    const res = await request(app)
      .get("/api/logout")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User logout successfully!");
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token=;"),
        expect.stringContaining("refresh_token=;"),
      ])
    );
  });

  test("Should return error if access_token is missing", async () => {
    const res = await request(app).get("/api/logout");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return error if refresh_token is invalid", async () => {
    const res = await request(app)
      .get("/api/logout")
      .set("Cookie", [access_token]);

    await db
      .collection("users")
      .updateOne({ username: "admin" }, { $set: { refresh_token: null } });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Please login first!");
  });
});

describe("POST /api/login", () => {
  test("Should login valid user and return cookies", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "12345" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token"),
        expect.stringContaining("refresh_token"),
      ])
    );
  });

  test("Should not login with empty username or password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "", password: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "All fields are required!");
  });

  test("Should not login with non-existing username", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "nonexistent", password: "12345" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid username/password.");
  });

  test("Should not login invalid user", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "wrongpassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid username/password.");
  });
});

describe("GET /api/login (checkToken)", () => {
  test("Should return valid token and set access_token cookie", async () => {
    const res = await request(app)
      .get("/api/login")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Token is valid.");
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("access_token")])
    );
  });

  test("Should return error if refresh_token is missing", async () => {
    const res = await request(app).get("/api/login");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return error if refresh_token is invalid", async () => {
    const res = await request(app)
      .get("/api/login")
      .set("Cookie", ["refresh_token=invalidtoken"]);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return error if refresh_token is expired", async () => {
    await db
      .collection("users")
      .updateOne({ username: "admin" }, { $set: { refresh_token: null } });
    const res = await request(app)
      .get("/api/login")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Please login first!");
  });
});

describe("POST /api/register", () => {
  test("Should register a new user", async () => {
    const res = await request(app)
      .post("/api/register")
      .set("Cookie", [access_token])
      .send({
        username: "user1",
        password: "user123",
        name: "User One",
        role: "driver",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty(
      "message",
      expect.stringContaining("created successfully")
    );
  });

  test("Should not register user with existing username", async () => {
    await db.collection("users").insertOne({
      username: "user1",
      password: hashPassword("user123"),
      name: "User One",
      role: "driver",
    });

    const res = await request(app)
      .post("/api/register")
      .set("Cookie", [access_token])
      .send({
        username: "user1",
        password: "user123",
        name: "User One",
        role: "driver",
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty(
      "message",
      expect.stringContaining("User already exists!")
    );
  });

  test("Should not register user with empty fields", async () => {
    const res = await request(app)
      .post("/api/register")
      .set("Cookie", [access_token])
      .send({
        username: "",
        password: "",
        name: "",
        role: "",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "All fields are required!");
  });

  test("Should not register user without access token", async () => {
    const res = await request(app).post("/api/register").send({
      username: "user1",
      password: "user123",
      name: "User One",
      role: "driver",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });
});

describe("GET /api/users", () => {
  test("Should return list of users", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Should not return users without access token", async () => {
    const res = await request(app).get("/api/users");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should not return users with internal server error", async () => {
    await connection.close();

    const res = await request(app)
      .get("/api/users")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");

    connection = await MongoClient.connect(mongoServer.getUri());
    db = connection.db("stockify");
  });
});
