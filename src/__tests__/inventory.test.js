const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const app = require("../../app");
const { signAccessToken } = require("../helpers/jwt");

let mongoServer;
let connection;
let db;
let access_token;

beforeAll(async () => {
  // Jalankan MongoDB in-memory
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect ke test database
  connection = await MongoClient.connect(uri);
  db = connection.db("stockify");

  // Inject test DB ke config asli
  const originalDb = require("../config/mongodb");
  Object.assign(originalDb, db);

  // Buat user untuk autentikasi
  const user = {
    username: "admin",
    password: "hashedpassword",
    role: "warehouse",
  };
  const insertedUser = await db.collection("users").insertOne(user);

  // Buat access_token untuk user
  access_token = `Bearer ${signAccessToken({
    id: insertedUser.insertedId,
    role: user.role,
  })}`;
});

afterAll(async () => {
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  // Bersihkan koleksi setelah setiap pengujian
  await db.collection("products").deleteMany({});
});

describe("GET /api/inventory", () => {
  test("Should return a list of inventories (success)", async () => {
    // Tambahkan data dummy
    await db.collection("products").insertMany([
      {
        name: "Product A",
        stock: 10,
        price: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Product B",
        stock: 5,
        price: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get("/api/inventory")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(2);
    expect(res.body.products[0]).toHaveProperty("name", "Product A");
    expect(res.body.products[1]).toHaveProperty("name", "Product B");
  });

  // test("Should return an empty list if no inventories found", async () => {
  //   const res = await request(app)
  //     .get("/api/inventory")
  //     .set("Authorization", access_token);

  //   expect(res.statusCode).toBe(200);
  //   expect(Array.isArray(res.body.products)).toBe(true);
  //   expect(res.body.products.length).toBe(0);
  // });

  // test("Should support search functionality", async () => {
  //   await db.collection("products").insertMany([
  //     {
  //       name: "Product A",
  //       stock: 10,
  //       price: 100,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     },
  //     {
  //       name: "Product B",
  //       stock: 5,
  //       price: 50,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     },
  //   ]);

  //   const res = await request(app)
  //     .get("/api/inventory?search=Product A")
  //     .set("Authorization", access_token);

  //   expect(res.statusCode).toBe(200);
  //   expect(Array.isArray(res.body.products)).toBe(true);
  //   expect(res.body.products.length).toBe(1);
  //   expect(res.body.products[0]).toHaveProperty("name", "Product A");
  // });

  // test("Should support pagination", async () => {
  //   await db.collection("products").insertMany([
  //     {
  //       name: "Product A",
  //       stock: 10,
  //       price: 100,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     },
  //     {
  //       name: "Product B",
  //       stock: 5,
  //       price: 50,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     },
  //     {
  //       name: "Product C",
  //       stock: 15,
  //       price: 150,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     },
  //   ]);

  //   const res = await request(app)
  //     .get("/api/inventory?page=1&limit=2")
  //     .set("Authorization", access_token);

  //   expect(res.statusCode).toBe(200);
  //   expect(Array.isArray(res.body.data)).toBe(true);
  //   expect(res.body.data.length).toBe(2); // Hanya 2 item per halaman
  //   expect(res.body).toHaveProperty("totalItems", 3);
  //   expect(res.body).toHaveProperty("totalPages", 2);
  // });

  // test("Should return 401 if no access token is provided", async () => {
  //   const res = await request(app).get("/api/inventory"); // Tidak mengirim access_token

  //   expect(res.statusCode).toBe(401);
  //   expect(res.body).toHaveProperty("message", "Invalid token.");
  // });

  // test("Should handle errors gracefully", async () => {
  //   // Simulasikan error dengan memodifikasi database
  //   jest.spyOn(db.collection("products"), "find").mockImplementationOnce(() => {
  //     throw new Error("Database error");
  //   });

  //   const res = await request(app)
  //     .get("/api/inventory")
  //     .set("Authorization", access_token);

  //   expect(res.statusCode).toBe(500);
  //   expect(res.body).toHaveProperty("message", "Internal Server Error");
  // });
});
