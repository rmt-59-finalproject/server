const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient, ObjectId } = require("mongodb");
const app = require("../../app");
const { hashPassword } = require("../helpers/bcrypt");

let mongoServer;
let connection;
let db;
let access_token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  connection = await MongoClient.connect(uri);
  db = connection.db("stockify");

  const originalDb = require("../config/mongodb");
  Object.assign(originalDb, db);

  const outlet = await db.collection("users").insertOne({
    username: "outlet1",
    password: hashPassword("12345"),
    role: "outlet",
  });

  const loginRes = await request(app)
    .post("/api/login")
    .send({ username: "outlet1", password: "12345" });

  const cookies = loginRes.headers["set-cookie"] || [];
  const accessTokenCookie = cookies.find((cookie) =>
    cookie.startsWith("access_token")
  );
  access_token = accessTokenCookie.split(";")[0];
});

afterAll(async () => {
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  await db.collection("orders").deleteMany({});
  await db.collection("products").deleteMany({});
});

describe("GET /api/outlet/orders", () => {
  test("Should return a list of orders for the outlet (success)", async () => {
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const outlet = await db.collection("users").findOne({
      username: "outlet1",
    });

    await db.collection("orders").insertOne({
      driverId: driver.insertedId,
      outletId: outlet._id,
      status: "pending",
      notes: "Urgent delivery",
      items: [
        {
          productId: product.insertedId,
          quantity: 5,
          checkedByDriver: false,
          checkedByOutlet: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get("/api/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("status", "pending");
    expect(res.body[0]).toHaveProperty("notes", "Urgent delivery");
  });

  test("Should filter orders by status", async () => {

    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const outlet = await db.collection("users").findOne({
      username: "outlet1",
    });

    await db.collection("orders").insertMany([
      {
        driverId: driver.insertedId,
        outletId: outlet._id,
        status: "pending",
        notes: "Urgent delivery",
        items: [
          {
            productId: product.insertedId,
            quantity: 5,
            checkedByDriver: false,
            checkedByOutlet: false,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        driverId: driver.insertedId,
        outletId: outlet._id,
        status: "completed",
        notes: "Delivered successfully",
        items: [
          {
            productId: product.insertedId,
            quantity: 3,
            checkedByDriver: true,
            checkedByOutlet: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get("/api/outlet/orders?status=pending")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("status", "pending");
  });

  test("Should return 404 if no orders found", async () => {
    const res = await request(app)
      .get("/api/outlet/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get("/api/outlet/orders");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return 403 if user is not authorized", async () => {
    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const loginRes = await request(app)
      .post("/api/login")
      .send({ username: "driver1", password: "12345" });

    const cookies = loginRes.headers["set-cookie"] || [];
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.startsWith("access_token")
    );
    const driverAccessToken = accessTokenCookie.split(";")[0];

    const res = await request(app)
      .get("/api/outlet/orders")
      .set("Cookie", [driverAccessToken]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty(
      "message",
      "You are not authorized to access this resource."
    );
  });

  test("Should handle errors gracefully", async () => {
    jest
      .spyOn(require("../models/outlet.model"), "getAllOrders")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get("/api/outlet/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("GET /api/outlet/orders/:id", () => {
  test("Should return a single order by ID (success)", async () => {
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const outlet = await db.collection("users").findOne({
      username: "outlet1",
    });

    const order = await db.collection("orders").insertOne({
      driverId: driver.insertedId,
      outletId: outlet._id,
      status: "pending",
      notes: "Urgent delivery",
      items: [
        {
          productId: product.insertedId,
          quantity: 5,
          checkedByDriver: false,
          checkedByOutlet: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get(`/api/outlet/orders/${order.insertedId}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "pending");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0]).toHaveProperty("name", "Product A");
  });

  test("Should return 404 if order not found", async () => {
    const res = await request(app)
      .get(`/api/outlet/orders/${new ObjectId()}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .get("/api/outlet/orders/invalid-id")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid ID.");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get(`/api/orders/${new ObjectId()}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return 403 if user is not authorized", async () => {
    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const loginRes = await request(app)
      .post("/api/login")
      .send({ username: "driver1", password: "12345" });

    const cookies = loginRes.headers["set-cookie"] || [];
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.startsWith("access_token")
    );
    const driverAccessToken = accessTokenCookie.split(";")[0];

    const res = await request(app)
      .get(`/api/outlet/orders/${new ObjectId()}`)
      .set("Cookie", [driverAccessToken]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty(
      "message",
      "You are not authorized to access this resource."
    );
  });

  test("Should handle errors gracefully", async () => {
    jest
      .spyOn(require("../models/outlet.model"), "getOrderById")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get(`/api/outlet/orders/${new ObjectId()}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("PATCH /api/outlet/orders/:id", () => {
  test("Should update item status by outlet (success)", async () => {
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const outlet = await db.collection("users").findOne({
      username: "outlet1",
    });

    const order = await db.collection("orders").insertOne({
      driverId: new ObjectId(),
      outletId: outlet._id,
      status: "pending",
      items: [
        {
          productId: product.insertedId,
          quantity: 5,
          checkedByDriver: false,
          checkedByOutlet: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/outlet/orders/${order.insertedId}`)
      .set("Cookie", [access_token])
      .send({
        productId: product.insertedId.toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Outlet checked 5 pcs of Product A."
    );
  });

  test("Should return 400 if productId is not provided", async () => {
    const order = await db.collection("orders").insertOne({
      driverId: new ObjectId(),
      outletId: new ObjectId(),
      status: "pending",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/outlet/orders/${order.insertedId}`)
      .set("Cookie", [access_token])
      .send({
        status: "true",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Product ID is required.");
  });

  test("Should return 404 if order not found", async () => {
    const res = await request(app)
      .patch(`/api/outlet/orders/${new ObjectId()}`)
      .set("Cookie", [access_token])
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Order not found or item not in order."
    );
  });

  test("Should return 404 if product not found", async () => {
    const outlet = await db.collection("users").findOne({
      username: "outlet1",
    });

    const order = await db.collection("orders").insertOne({
      driverId: new ObjectId(),
      outletId: outlet._id,
      status: "pending",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/outlet/orders/${order.insertedId}`)
      .set("Cookie", [access_token])
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Order not found or item not in order."
    );
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .patch("/api/outlet/orders/invalid-id")
      .set("Cookie", [access_token])
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid ID.");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app)
      .patch(`/api/outlet/orders/${new ObjectId()}`)
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return 403 if user is not authorized", async () => {
    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const loginRes = await request(app)
      .post("/api/login")
      .send({ username: "driver1", password: "12345" });

    const cookies = loginRes.headers["set-cookie"] || [];
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.startsWith("access_token")
    );
    const driverAccessToken = accessTokenCookie.split(";")[0];

    const res = await request(app)
      .patch(`/api/outlet/orders/${new ObjectId()}`)
      .set("Cookie", [driverAccessToken])
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty(
      "message",
      "You are not authorized to access this resource."
    );
  });

  test("Should handle errors gracefully", async () => {
    jest
      .spyOn(require("../models/outlet.model"), "updateItemStatus")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .patch(`/api/outlet/orders/${new ObjectId()}`)
      .set("Cookie", [access_token])
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});
