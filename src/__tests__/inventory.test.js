const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient, ObjectId } = require("mongodb");
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
  expect(refreshTokenCookie).toBeDefined();

  if (accessTokenCookie) {
    access_token = accessTokenCookie.split(";")[0];
  }
  if (refreshTokenCookie) {
    refresh_token = refreshTokenCookie.split(";")[0];
  }
});

afterAll(async () => {
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  await db.collection("products").deleteMany({});
});

describe("GET /api/inventory", () => {
  test("Should return a list of inventories (success)", async () => {
    await db.collection("products").insertMany([
      {
        name: "Product A",
        stock: 10,
        unit: "pcs",
        category: "Bahan Pokok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Product B",
        stock: 5,
        unit: "pcs",
        category: "Bahan Pokok",
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

  test("Should return an empty list if no inventories found", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(0);
  });

  test("Should support search functionality", async () => {
    await db.collection("products").insertMany([
      {
        name: "Product A",
        stock: 10,
        unit: "pcs",
        category: "Bahan Pokok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Product B",
        stock: 5,
        unit: "pcs",
        category: "Bahan Pokok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get("/api/inventory?search=Product A")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0]).toHaveProperty("name", "Product A");
  });

  test("Should support pagination", async () => {
    await db.collection("products").insertMany([
      {
        name: "Product A",
        stock: 10,
        unit: "pcs",
        category: "Bahan Pokok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Product B",
        stock: 5,
        unit: "pcs",
        category: "Bahan Pokok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Product C",
        stock: 15,
        unit: "pcs",
        category: "Bahan Pokok",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get("/api/inventory?page=1&limit=2")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body).toHaveProperty("totalItems", 3);
    expect(res.body).toHaveProperty("totalPages", 2);
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get("/api/inventory");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    jest
      .spyOn(require("../models/product.model"), "getAll")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get("/api/inventory")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("GET /api/inventory/:id", () => {
  test("Should return a single inventory by ID (success)", async () => {
    const product = await db.collection("products").insertOne({
      name: "Product A",
      stock: 10,
      unit: "pcs",
      category: "Bahan Pokok",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const id = product.insertedId.toString();

    const res = await request(app)
      .get(`/api/inventory/${id}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name", "Product A");
    expect(res.body).toHaveProperty("stock", 10);
    expect(res.body).toHaveProperty("unit", "pcs");
    expect(res.body).toHaveProperty("category", "Bahan Pokok");
  });

  test("Should return 404 if inventory not found", async () => {
    const res = await request(app)
      .get(`/api/inventory/${new ObjectId()}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Product not found");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .get("/api/inventory/invalid-id")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid product ID");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get(`/api/inventory/${new ObjectId()}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });
});

describe("POST /api/inventory", () => {
  test("Should create a new inventory (success)", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Cookie", [access_token])
      .send({
        name: "Product A",
        stock: 10,
        unit: "pcs",
        category: "Bahan Pokok",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("name", "Product A");
    expect(res.body).toHaveProperty("stock", 10);
    expect(res.body).toHaveProperty("unit", "pcs");
    expect(res.body).toHaveProperty("category", "Bahan Pokok");
  });

  test("Should return 409 if product already exists", async () => {
    await db.collection("products").insertOne({
      name: "Product A",
      stock: 10,
      unit: "pcs",
      category: "Bahan Pokok",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/inventory")
      .set("Cookie", [access_token])
      .send({
        name: "Product A",
        stock: 5,
        unit: "pcs",
        category: "Bahan Pokok",
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("message", "This product already exists");
  });

  test("Should return 400 if input validation fails", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Cookie", [access_token])
      .send({
        name: "",
        stock: -5,
        unit: "",
        category: "",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("Name: name is required");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).post("/api/inventory").send({
      name: "Product A",
      stock: 10,
      unit: "pcs",
      category: "Bahan Pokok",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    jest
      .spyOn(require("../models/product.model"), "create")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .post("/api/inventory")
      .set("Cookie", [access_token])
      .send({
        name: "Product A",
        stock: 10,
        unit: "pcs",
        category: "Bahan Pokok",
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("PATCH /api/inventory/:id", () => {
  test("Should update an inventory (success)", async () => {
    const product = await db.collection("products").insertOne({
      name: "Product A",
      stock: 10,
      unit: "pcs",
      category: "Bahan Pokok",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const id = product.insertedId.toString();

    const res = await request(app)
      .patch(`/api/inventory/${id}`)
      .set("Cookie", [access_token])
      .send({
        stock: 20,
        unit: "kg",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Product A updated successfully"
    );
  });

  test("Should return 404 if inventory not found", async () => {
    const res = await request(app)
      .patch(`/api/inventory/${new ObjectId()}`)
      .set("Cookie", [access_token])
      .send({
        stock: 20,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Product not found");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .patch("/api/inventory/invalid-id")
      .set("Cookie", [access_token])
      .send({
        stock: 20,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid product ID");
  });

  test("Should return 400 if input validation fails", async () => {
    const product = await db.collection("products").insertOne({
      name: "Product A",
      stock: 10,
      unit: "pcs",
      category: "Bahan Pokok",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const id = product.insertedId.toString();

    const res = await request(app)
      .patch(`/api/inventory/${id}`)
      .set("Cookie", [access_token])
      .send({
        stock: -5,
        unit: "",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("Stock: stock cannot be negative");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app)
      .patch(`/api/inventory/${new ObjectId()}`)
      .send({
        stock: 20,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    jest
      .spyOn(require("../models/product.model"), "update")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .patch(`/api/inventory/${new ObjectId()}`)
      .set("Cookie", [access_token])
      .send({
        stock: 20,
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("DELETE /api/inventory/:id", () => {
  test("Should delete an inventory (success)", async () => {
    const product = await db.collection("products").insertOne({
      name: "Product A",
      stock: 10,
      unit: "pcs",
      category: "Bahan Pokok",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const id = product.insertedId.toString();

    const res = await request(app)
      .delete(`/api/inventory/${id}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Product A deleted successfully"
    );
  });

  test("Should return 404 if inventory not found", async () => {
    const res = await request(app)
      .delete(`/api/inventory/${new ObjectId()}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Product not found");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .delete("/api/inventory/invalid-id")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid product ID");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app)
      .delete(`/api/inventory/${new ObjectId()}`)
      .send();

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    jest
      .spyOn(require("../models/product.model"), "delete")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .delete(`/api/inventory/${new ObjectId()}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});
