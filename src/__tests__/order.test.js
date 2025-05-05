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
  await db.collection("users").insertOne({
    username: "admin",
    password: hashPassword("12345"), // ini yang benar
    name: "Admin Warehouse",
    role: "warehouse",
  });

  // Buat access_token untuk user
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
  await db.collection("orders").deleteMany({});
  await db.collection("products").deleteMany({});
});

describe("GET /api/orders", () => {
  test("Should return a list of orders (success)", async () => {
    // Tambahkan data dummy
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

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    await db.collection("orders").insertOne({
      driverId: driver.insertedId,
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
      .get("/api/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("status", "pending");
    expect(res.body[0]).toHaveProperty("notes", "Urgent delivery");
  });

  test("Should filter orders by status", async () => {
    // Tambahkan data dummy
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

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    await db.collection("orders").insertMany([
      {
        driverId: driver.insertedId,
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
        driverId: driver.insertedId,
        outletId: outlet.insertedId,
        status: "completed",
        notes: "Delivered successfully",
        items: [
          {
            productId: product.insertedId,
            quantity: 3,
            checkedByDriver: true,
            driverCheckTime: new Date(),
            checkedByOutlet: true,
            outletCheckTime: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get("/api/orders?status=pending")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("status", "pending");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get("/api/orders");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    // Simulasikan error dengan memmock OrderModel.getAllOrders
    jest
      .spyOn(require("../models/order.model"), "getAllOrders")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get("/api/orders")
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("POST /api/orders", () => {
  test("Should create a new order (success)", async () => {
    // Tambahkan data dummy produk
    const product = await db.collection("products").insertOne({
      name: "Product A",
      unit: "pcs",
      category: "Bahan Pokok",
    });

    // Login sebagai outlet
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
    const access_token = accessTokenCookie.split(";")[0];

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", [access_token])
      .send({
        items: [
          {
            productId: product.insertedId.toString(),
            quantity: 5,
          },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty(
      "message",
      "Successfully create new order."
    );
  });

  test("Should return 403 if user is not authorized", async () => {
    // Login sebagai driver
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
    const access_token = accessTokenCookie.split(";")[0];

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", [access_token])
      .send({
        items: [
          {
            productId: new ObjectId().toString(),
            quantity: 5,
          },
        ],
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty(
      "message",
      "You are not authorized to access this resource."
    );
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [
          {
            productId: new ObjectId().toString(),
            quantity: 5,
          },
        ],
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    // Simulasikan error dengan memmock OrderModel.postOrder
    jest
      .spyOn(require("../models/order.model"), "postOrder")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    // Login sebagai outlet
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
    const access_token = accessTokenCookie.split(";")[0];

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", [access_token])
      .send({
        items: [
          {
            productId: new ObjectId().toString(),
            quantity: 5,
          },
        ],
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("GET /api/orders/:id", () => {
  test("Should return a single order by ID (success)", async () => {
    // Tambahkan data dummy produk
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

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const order = await db.collection("orders").insertOne({
      driverId: driver.insertedId,
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
      .get(`/api/orders/${order.insertedId}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "pending");
    expect(res.body).toHaveProperty("notes", "Urgent delivery");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0]).toHaveProperty("name", "Product A");
  });

  test("Should return 404 if order not found", async () => {
    const res = await request(app)
      .get(`/api/orders/${new ObjectId()}`) // ID valid tetapi tidak ada di database
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .get("/api/orders/invalid-id") // ID tidak valid
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid ID.");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).get(`/api/orders/${new ObjectId()}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    // Simulasikan error dengan memmock OrderModel.getOrderById
    jest
      .spyOn(require("../models/order.model"), "getOrderById")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get(`/api/orders/${new ObjectId()}`)
      .set("Cookie", [access_token]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("PATCH /api/orders/:id", () => {
  test("Should update order status (success)", async () => {
    // Tambahkan data dummy produk
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

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const order = await db.collection("orders").insertOne({
      driverId: driver.insertedId,
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
      .patch(`/api/orders/${order.insertedId}`)
      .set("Cookie", [access_token])
      .send({
        status: "completed",
        notes: "Delivered successfully",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Successfully update order status to completed"
    );
  });

  test("Should return 404 if order not found", async () => {
    const res = await request(app)
      .patch(`/api/orders/${new ObjectId()}`) // ID valid tetapi tidak ada di database
      .set("Cookie", [access_token])
      .send({
        status: "completed",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 400 if ID is invalid", async () => {
    const res = await request(app)
      .patch("/api/orders/invalid-id") // ID tidak valid
      .set("Cookie", [access_token])
      .send({
        status: "completed",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid ID.");
  });

  test("Should return 401 if no access token is provided", async () => {
    const res = await request(app).patch(`/api/orders/${new ObjectId()}`).send({
      status: "completed",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    // Simulasikan error dengan memmock OrderModel.patchOrderStatus
    jest
      .spyOn(require("../models/order.model"), "patchOrderStatus")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .patch(`/api/orders/${new ObjectId()}`)
      .set("Cookie", [access_token])
      .send({
        status: "completed",
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});

describe("PATCH /api/orders/:id/driver", () => {
  test("Should assign a driver to an order (success)", async () => {
    // Tambahkan data dummy driver
    const driverInsertResult = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    // Ambil data lengkap driver dari database
    const driver = await db
      .collection("users")
      .findOne({ _id: driverInsertResult.insertedId });

    // Tambahkan data dummy order
    const order = await db.collection("orders").insertOne({
      driverId: null,
      outletId: new ObjectId(),
      status: "pending",
      notes: "Urgent delivery",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/orders/${order.insertedId}/driver`)
      .set("Cookie", [access_token])
      .send({
        driverId: driver._id.toString(), // ID driver yang valid
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      `Successfully assign order to ${driver.username}`
    );
  });

  test("Should return 404 if driver not found", async () => {
    const order = await db.collection("orders").insertOne({
      driverId: null,
      outletId: new ObjectId(),
      status: "pending",
      notes: "Urgent delivery",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/orders/${order.insertedId}/driver`)
      .set("Cookie", [access_token])
      .send({
        driverId: new ObjectId().toString(), // ID valid tetapi tidak ada di database
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Driver not found!");
  });

  test("Should return 404 if order not found", async () => {
    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const res = await request(app)
      .patch(`/api/orders/${new ObjectId()}/driver`) // ID valid tetapi tidak ada di database
      .set("Cookie", [access_token])
      .send({
        driverId: driver.insertedId.toString(),
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found!");
  });

  test("Should return 400 if ID is invalid", async () => {
    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const res = await request(app)
      .patch("/api/orders/invalid-id/driver") // ID tidak valid
      .set("Cookie", [access_token])
      .send({
        driverId: driver.insertedId.toString(),
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid ID.");
  });

  test("Should return 401 if no access token is provided", async () => {
    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const order = await db.collection("orders").insertOne({
      driverId: null,
      outletId: new ObjectId(),
      status: "pending",
      notes: "Urgent delivery",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .patch(`/api/orders/${order.insertedId}/driver`)
      .send({
        driverId: driver.insertedId.toString(),
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid token.");
  });

  test("Should handle errors gracefully", async () => {
    // Simulasikan error dengan memmock OrderModel.patchOrderDriver
    jest
      .spyOn(require("../models/order.model"), "patchOrderDriver")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const driver = await db.collection("users").insertOne({
      username: "driver1",
      password: hashPassword("12345"),
      role: "driver",
    });

    const res = await request(app)
      .patch(`/api/orders/${new ObjectId()}/driver`)
      .set("Cookie", [access_token])
      .send({
        driverId: driver.insertedId.toString(),
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error.");
  });
});
