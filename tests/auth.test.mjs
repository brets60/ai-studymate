import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode("test-secret-key-for-testing-purposes-123");

test("Authentication - Password hashing and verification", async () => {
  const password = "SecureStudentPass123!";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  assert.notEqual(hash, password);
  assert.ok(hash.startsWith("$2"));

  const isValid = await bcrypt.compare(password, hash);
  assert.equal(isValid, true, "Valid password should match hash");

  const isInvalid = await bcrypt.compare("WrongPassword!", hash);
  assert.equal(isInvalid, false, "Invalid password must not match hash");
});

test("Authentication - JWT session token creation and verification", async () => {
  const payload = {
    userId: "usr_12345",
    email: "student@school.edu",
    fullName: "Alex Rivera",
    educationLevel: "College / University",
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  assert.ok(typeof token === "string");
  assert.ok(token.split(".").length === 3);

  const { payload: verified } = await jwtVerify(token, JWT_SECRET);
  assert.equal(verified.userId, payload.userId);
  assert.equal(verified.email, payload.email);
  assert.equal(verified.fullName, payload.fullName);
});

test("Authentication - Rejects expired or tampered token", async () => {
  const token = await new SignJWT({ userId: "usr_1" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("0s") // expired
    .sign(JWT_SECRET);

  await assert.rejects(async () => {
    await jwtVerify(token, JWT_SECRET);
  });
});
