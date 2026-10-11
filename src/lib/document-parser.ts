import fs from "fs/promises";
import path from "path";

export interface ParsedDocumentResult {
  text: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export const ALLOWED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export async function extractTextFromFile(
  filePath: string,
  mimeType: string
): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);

    if (
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      filePath.endsWith(".txt") ||
      filePath.endsWith(".md") ||
      filePath.endsWith(".csv")
    ) {
      return fileBuffer.toString("utf-8");
    }

    if (mimeType === "application/pdf") {
      // Basic text extraction for PDF text streams
      const raw = fileBuffer.toString("latin1");
      const textMatches: string[] = [];
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      let match;
      while ((match = streamRegex.exec(raw)) !== null) {
        const streamData = match[1];
        // Extract visible characters
        const cleanChars = streamData.replace(/[^a-zA-Z0-9.,;:!?()\-\s]/g, " ");
        if (cleanChars.trim().length > 20) {
          textMatches.push(cleanChars.trim());
        }
      }

      if (textMatches.length > 0) {
        return textMatches.join("\n\n").slice(0, 15000);
      }
      return `[PDF Document: ${path.basename(filePath)} loaded successfully for lesson analysis]`;
    }

    if (mimeType.startsWith("image/")) {
      return `[Academic Diagram / Illustration: ${path.basename(filePath)} uploaded for visual AI analysis]`;
    }

    return fileBuffer.toString("utf-8").slice(0, 10000);
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error("Failed to extract content from uploaded document");
  }
}
