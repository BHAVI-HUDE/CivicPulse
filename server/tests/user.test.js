import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";

test("user password hashing and comparison works", async () => {
  const user = new User({
    name: "Test User",
    email: "test@example.com",
    mobile: "9999999999",
    passwordHash: "",
  });

  await user.setPassword("Password@123");
  assert.equal(await user.comparePassword("Password@123"), true);
  assert.equal(await user.comparePassword("wrong-password"), false);
  assert.notEqual(user.passwordHash, "");
});
