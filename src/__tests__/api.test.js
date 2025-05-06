const request = require("supertest");
const app = require("../../app");

describe("GET /api", () => {
  test("Return the correct message from the route", async () => {
    const response = await request(app).get("/api");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Stockify API");
  });
});
