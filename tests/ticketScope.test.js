const test = require("node:test");
const assert = require("node:assert/strict");
const ticketScope = require("../src/utils/ticketScope");

test("user can only see tickets they own", () => {
  const id = "user-1";
  assert.deepEqual(ticketScope({ _id: id, role: "user" }), { owner: id });
});

test("agent can see tickets they own or are assigned", () => {
  const id = "agent-1";
  assert.deepEqual(ticketScope({ _id: id, role: "agent" }), { $or: [{ owner: id }, { assignedTo: id }] });
});

test("admin scope intentionally includes all tickets in this single-tenant MVP", () => {
  assert.deepEqual(ticketScope({ _id: "admin-1", role: "admin" }), {});
});
