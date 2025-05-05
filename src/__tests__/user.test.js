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
  // Jalankan MongoDB in-memory
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect ke test database
  connection = await MongoClient.connect(uri);
  db = connection.db("stockify");

  // Inject test DB ke config asli
  const originalDb = require("../config/mongodb");
  Object.assign(originalDb, db); // redirect semua ke test DB

  // Buat 1 user dengan password yang benar
  await db.collection("users").insertOne({
    username: "admin",
    password: hashPassword("12345"), // ini yang benar
    name: "Admin Warehouse",
    role: "warehouse",
  });

  // Login untuk mendapatkan cookies
  const loginRes = await request(app)
    .post("/api/login") // 🔥 ini penting! gunakan path yang benar
    .send({ username: "admin", password: "12345" }); // password harus cocok

  const cookies = loginRes.headers["set-cookie"] || [];

  const accessTokenCookie = cookies.find((cookie) =>
    cookie.startsWith("access_token")
  );
  const refreshTokenCookie = cookies.find((cookie) =>
    cookie.startsWith("refresh_token")
  );

  expect(accessTokenCookie).toBeDefined(); // Test ini akan gagal kalau login gagal
  expect(refreshTokenCookie).toBeDefined(); // Pastikan refresh_token juga ada

  if (accessTokenCookie) {
    access_token = accessTokenCookie.split(";")[0]; // Simpan access_token
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
  // Hapus semua user kecuali admin
  await db.collection("users").deleteMany({ username: { $ne: "admin" } });
});

describe("GET /api/logout", () => {
  test("Should clear cookies and return success message", async () => {
    const res = await request(app)
      .get("/api/logout")
      .set("Cookie", [access_token]); // Kirim access_token dan refresh_token sebagai cookie

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User logout successfully!");
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token=;"), // Cookie access_token dihapus
        expect.stringContaining("refresh_token=;"), // Cookie refresh_token dihapus
      ])
    );
  });

  test("Should return error if access_token is missing", async () => {
    const res = await request(app).get("/api/logout"); // Tidak mengirim token

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return error if refresh_token is invalid", async () => {
    const res = await request(app)
      .get("/api/logout")
      .set("Cookie", [access_token]);

    await db.collection("users").updateOne(
      { username: "admin" },
      { $set: { refresh_token: null } } // Set refresh_token ke null
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Please login first!");
  });
});

describe("POST /api/login", () => {
  test("Should login valid user and return cookies", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "12345" }); // harus cocok dengan yang disimpan

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
      .send({ username: "", password: "" }); // username dan password kosong

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "All fields are required!");
  });

  test("Should not login with non-existing username", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "nonexistent", password: "12345" }); // username tidak ada

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid username/password.");
  });

  test("Should not login invalid user", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "wrongpassword" }); // password salah

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid username/password.");
  });
});

describe("GET /api/login (checkToken)", () => {
  test("Should return valid token and set access_token cookie", async () => {
    const res = await request(app)
      .get("/api/login")
      .set("Cookie", [access_token]); // Kirim access_token sebagai cookie

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Token is valid.");
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("access_token")])
    );
  });

  test("Should return error if refresh_token is missing", async () => {
    const res = await request(app).get("/api/login"); // Tidak mengirim token

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return error if refresh_token is invalid", async () => {
    const res = await request(app)
      .get("/api/login")
      .set("Cookie", ["refresh_token=invalidtoken"]); // Kirim token tidak valid

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return error if refresh_token is expired", async () => {
    await db.collection("users").updateOne(
      { username: "admin" },
      { $set: { refresh_token: null } } // Set refresh_token ke null
    );
    const res = await request(app)
      .get("/api/login")
      .set("Cookie", [access_token]); // Kirim refresh_token sebagai cookie

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Please login first!");
  });
});

describe("POST /api/register", () => {
  test("Should register a new user", async () => {
    const res = await request(app)
      .post("/api/register")
      .set("Cookie", [access_token]) // Kirim access_token sebagai cookie
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
      .set("Cookie", [access_token]); // Kirim access_token sebagai cookie

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Should not return users without access token", async () => {
    const res = await request(app).get("/api/users");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should not return users with internal server error", async () => {
    // Simulate an internal server error by closing the connection
    await connection.close();

    const res = await request(app)
      .get("/api/users")
      .set("Cookie", [access_token]); // Kirim access_token sebagai cookie

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");

    // Reconnect to the database for further tests
    connection = await MongoClient.connect(mongoServer.getUri());
    db = connection.db("stockify");
  });
});
