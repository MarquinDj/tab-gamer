import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test("GET to /api/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();

  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  const queryVersion = responseBody.dependencies.version;
  expect(queryVersion).toEqual("16.0");

  const maxCon = responseBody.dependencies.max_connections;
  expect(maxCon).toEqual(100);

  const openedCon = responseBody.dependencies.opened_connections;
  expect(openedCon).toEqual(1);
});
