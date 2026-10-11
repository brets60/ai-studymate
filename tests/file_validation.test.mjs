import test from "node:test";
import assert from "node:assert/strict";

const ALLOWED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateUpload({ filename, mimeType, sizeBytes }) {
  if (sizeBytes > MAX_FILE_SIZE) {
    return { valid: false, error: "File exceeds 10MB maximum allowed size" };
  }

  const isAllowedMime = ALLOWED_MIME_TYPES.includes(mimeType);
  const isAllowedExt = Boolean(filename.match(/\.(txt|md|csv|json|pdf|png|jpe?g|webp)$/i));

  if (!isAllowedMime && !isAllowedExt) {
    return { valid: false, error: "Unsupported file type" };
  }

  // Prevent path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  return { valid: true, sanitizedFilename };
}

test("File Validation - Accepts valid educational documents", () => {
  const result = validateUpload({
    filename: "lecture_notes.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2 * 1024 * 1024,
  });

  assert.equal(result.valid, true);
  assert.equal(result.sanitizedFilename, "lecture_notes.pdf");
});

test("File Validation - Rejects files exceeding 10MB", () => {
  const result = validateUpload({
    filename: "huge_textbook.pdf",
    mimeType: "application/pdf",
    sizeBytes: 15 * 1024 * 1024, // 15MB
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /10MB/);
});

test("File Validation - Rejects dangerous or executable file types", () => {
  const result = validateUpload({
    filename: "malicious_script.exe",
    mimeType: "application/x-msdownload",
    sizeBytes: 500,
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /Unsupported/);
});

test("File Validation - Sanitizes path traversal attempts in filename", () => {
  const result = validateUpload({
    filename: "../../../etc/passwd.txt",
    mimeType: "text/plain",
    sizeBytes: 100,
  });

  assert.equal(result.valid, true);
  assert.ok(!result.sanitizedFilename.includes("/"));
  assert.ok(!result.sanitizedFilename.includes("\\"));
});
