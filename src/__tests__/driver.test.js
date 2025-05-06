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
<<<<<<< HEAD
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  connection = await MongoClient.connect(uri);
  db = connection.db("stockify");

  const originalDb = require("../config/mongodb");
  Object.assign(originalDb, db);

=======
  // Jalankan MongoDB in-memory
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect ke test database
  connection = await MongoClient.connect(uri);
  db = connection.db("stockify");

  // Inject test DB ke config asli
  const originalDb = require("../config/mongodb");
  Object.assign(originalDb, db);

  // Buat user driver untuk autentikasi
>>>>>>> 79b3300 (feat: update-testing)
  const driver = await db.collection("users").insertOne({
    username: "driver1",
    password: hashPassword("12345"),
    role: "driver",
  });

<<<<<<< HEAD
=======
  // Login sebagai driver
>>>>>>> 79b3300 (feat: update-testing)
  const loginRes = await request(app)
    .post("/api/login")
    .send({ username: "driver1", password: "12345" });

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

describe("GET api/driver/orders", () => {
  test("Should return a list of orders assigned to the driver (success)", async () => {
<<<<<<< HEAD
=======
    // Tambahkan data dummy produk
>>>>>>> 79b3300 (feat: update-testing)
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const outlet = await db.collection("users").insertOne({
      username: "outlet1",
      password: hashPassword("12345"),
      role: "outlet",
    });

    const driver = await db.collection("users").findOne({
      username: "driver1",
    });

    await db.collection("orders").insertOne({
      driverId: driver._id,
      outletId: outlet.insertedId,
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
      .get("/api/driver/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("status", "pending");
  });

  test("Should filter orders by status", async () => {
<<<<<<< HEAD
=======
    // Tambahkan data dummy produk
>>>>>>> 79b3300 (feat: update-testing)
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const outlet = await db.collection("users").insertOne({
      username: "outlet1",
      password: hashPassword("12345"),
      role: "outlet",
    });

    const driver = await db.collection("users").findOne({
      username: "driver1",
    });

    await db.collection("orders").insertMany([
      {
        driverId: driver._id,
        outletId: outlet.insertedId,
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
        driverId: driver._id,
        outletId: outlet.insertedId,
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
      .get("/api/driver/orders?status=pending")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("status", "pending");
  });

  test("Should return 404 if no orders found", async () => {
    const res = await request(app)
      .get("/api/driver/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get("/api/driver/orders");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
<<<<<<< HEAD
=======
    // Simulasikan error dengan memmock DriverModel.getAllOrders
>>>>>>> 79b3300 (feat: update-testing)
    jest
      .spyOn(require("../models/driver.model"), "getAllOrders")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get("/api/driver/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });

  test("Should return 403 if user is not authorized", async () => {
<<<<<<< HEAD
=======
    // Tambahkan data dummy user dengan peran yang tidak diizinkan (misalnya, outlet)
>>>>>>> 79b3300 (feat: update-testing)
    const outlet = await db.collection("users").insertOne({
      username: "outlet1",
      password: hashPassword("12345"),
      role: "outlet",
    });

<<<<<<< HEAD
=======
    // Login sebagai outlet
>>>>>>> 79b3300 (feat: update-testing)
    const loginRes = await request(app)
      .post("/api/login")
      .send({ username: "outlet1", password: "12345" });

    const cookies = loginRes.headers["set-cookie"] || [];
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.startsWith("access_token")
    );
    const outletAccessToken = accessTokenCookie.split(";")[0];

<<<<<<< HEAD
=======
    // Coba akses endpoint dengan token outlet
>>>>>>> 79b3300 (feat: update-testing)
    const res = await request(app)
      .get("/api/driver/orders")
      .set("Cookie", [outletAccessToken]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty(
      "message",
      "You are not authorized to access this resource."
    );
  });
});

describe("GET /api/driver/orders/:id", () => {
  test("Should return a single order by ID (success)", async () => {
<<<<<<< HEAD
=======
    // Tambahkan data dummy produk
>>>>>>> 79b3300 (feat: update-testing)
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const outlet = await db.collection("users").insertOne({
      username: "outlet1",
      password: hashPassword("12345"),
      role: "outlet",
    });

    const driver = await db.collection("users").findOne({
      username: "driver1",
    });

    const order = await db.collection("orders").insertOne({
      driverId: driver._id,
      outletId: outlet.insertedId,
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

    const id = order.insertedId.toString();

    const res = await request(app)
      .get(`/api/driver/orders/${id}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "pending");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0]).toHaveProperty("name", "Product A");
  });

  test("Should return 404 if order not found", async () => {
    const res = await request(app)
<<<<<<< HEAD
      .get(`/api/driver/orders/${new ObjectId().toString()}`)
=======
      .get(`/api/driver/orders/${new ObjectId().toString()}`) // ID valid tetapi tidak ada di database
>>>>>>> 79b3300 (feat: update-testing)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
<<<<<<< HEAD
      .get("/api/driver/orders/invalid-id")
=======
      .get("/api/driver/orders/invalid-id") // ID tidak valid
>>>>>>> 79b3300 (feat: update-testing)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid ID.");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get(`/api/driver/orders/${new ObjectId()}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return 403 if user is not authorized", async () => {
<<<<<<< HEAD
=======
    // Tambahkan data dummy user dengan peran yang tidak diizinkan (misalnya, outlet)
>>>>>>> 79b3300 (feat: update-testing)
    const outlet = await db.collection("users").insertOne({
      username: "outlet1",
      password: hashPassword("12345"),
      role: "outlet",
    });

<<<<<<< HEAD
=======
    // Login sebagai outlet
>>>>>>> 79b3300 (feat: update-testing)
    const loginRes = await request(app)
      .post("/api/login")
      .send({ username: "outlet1", password: "12345" });

    const cookies = loginRes.headers["set-cookie"] || [];
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.startsWith("access_token")
    );
    const outletAccessToken = accessTokenCookie.split(";")[0];

<<<<<<< HEAD
=======
    // Coba akses endpoint dengan token outlet
>>>>>>> 79b3300 (feat: update-testing)
    const res = await request(app)
      .get(`/api/driver/orders/${new ObjectId()}`)
      .set("Cookie", [outletAccessToken]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty(
      "message",
      "You are not authorized to access this resource."
    );
  });

  test("Should handle errors gracefully", async () => {
<<<<<<< HEAD
=======
    // Simulasikan error dengan memmock DriverModel.getOrdersById
>>>>>>> 79b3300 (feat: update-testing)
    jest
      .spyOn(require("../models/driver.model"), "getOrdersById")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get(`/api/driver/orders/${new ObjectId()}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("PATCH /api/driver/orders/:id", () => {
  test("Should update item status (success)", async () => {
<<<<<<< HEAD
=======
    // Tambahkan data dummy produk
>>>>>>> 79b3300 (feat: update-testing)
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    const outlet = await db.collection("users").insertOne({
      username: "outlet1",
      password: hashPassword("12345"),
      role: "outlet",
    });

    const driver = await db.collection("users").findOne({
      username: "driver1",
    });

    const order = await db.collection("orders").insertOne({
      driverId: driver._id,
      outletId: outlet.insertedId,
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
      .patch(`/api/driver/orders/${order.insertedId}`)
      .set("Cookie", [access_token])
      .send({
        productId: product.insertedId.toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Checked 5 pcs of Product A.");
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
      .patch(`/api/driver/orders/${order.insertedId}`)
      .set("Cookie", [access_token])
      .send({
        status: "true",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Product ID is required.");
  });

  test("Should return 404 if order not found", async () => {
    const res = await request(app)
      .patch(`/api/driver/orders/${new ObjectId()}`)
      .set("Cookie", [access_token])
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 404 if product not found", async () => {
    const outlet = await db.collection("users").insertOne({
      username: "outlet1",
      password: hashPassword("12345"),
      role: "outlet",
    });

    const driver = await db.collection("users").findOne({
      username: "driver1",
    });

    const order = await db.collection("orders").insertOne({
      driverId: driver._id,
      outletId: outlet.insertedId,
      status: "pending",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/driver/orders/${order.insertedId}`)
      .set("Cookie", [access_token])
      .send({
<<<<<<< HEAD
        productId: new ObjectId().toString(),
=======
        productId: new ObjectId().toString(), // ID valid tetapi tidak ada di database
>>>>>>> 79b3300 (feat: update-testing)
        status: "true",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .patch("/api/driver/orders/invalid-id")
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
      .patch(`/api/driver/orders/${new ObjectId()}`)
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should return 403 if user is not authorized", async () => {
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
    const outletAccessToken = accessTokenCookie.split(";")[0];

    const res = await request(app)
      .patch(`/api/driver/orders/${new ObjectId()}`)
      .set("Cookie", [outletAccessToken])
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
      .spyOn(require("../models/driver.model"), "updateItemStatus")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .patch(`/api/driver/orders/${new ObjectId()}`)
      .set("Cookie", [access_token])
      .send({
        productId: new ObjectId().toString(),
        status: "true",
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});
