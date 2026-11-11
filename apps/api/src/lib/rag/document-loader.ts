
import fs from "node:fs/promises";
import path from "node:path";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";

import { pathToFileURL } from "node:url";

export type PolicyDocument = {
  documentId: string;
  title: string;
  content: string;
  source: string;
};

const POLICY_DIRECTORY = path.join(
  process.cwd(),
  "documents",
  "banking-policies"
);

const PDF_WORKER_PATH = path.join(
  process.cwd(),
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.mjs"
);

GlobalWorkerOptions.workerSrc =
  pathToFileURL(PDF_WORKER_PATH).href;

// Preserve IDs already referenced elsewhere in the application.
const EXISTING_POLICY_IDS: Record<string, string> = {
  "failed-transactions.md": "BANK-FT-001",
  "duplicate-transactions.md": "BANK-DT-001",
  "unauthorized-transactions.md": "BANK-UT-001",
};

function generateDocumentId(filename: string): string {
  const slug = path
    .basename(filename, path.extname(filename))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `BANK-${slug}`;
}

function generateTitle(filename: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m);

  if (heading?.[1]) {
    return heading[1].trim();
  }

  return path
    .basename(filename, path.extname(filename))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

async function extractPdfText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const STANDARD_FONT_DATA_PATH =
    path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "standard_fonts"
    ) + path.sep;
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    standardFontDataUrl: STANDARD_FONT_DATA_PATH,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .filter(
          (item): item is typeof item & { str: string } =>
            "str" in item
        )
        .map((item) => item.str)
        .join(" ");

      if (pageText.trim()) {
        pages.push(pageText.trim());
      }
    }

    return pages.join("\n\n").trim();
  } finally {
    await loadingTask.destroy();
  }
}

export async function loadPolicyDocuments(): Promise<PolicyDocument[]> {
  const entries = await fs.readdir(POLICY_DIRECTORY, {
    withFileTypes: true,
  });

  const supportedFiles = entries
    .filter((entry) => {
      if (!entry.isFile()) {
        return false;
      }

      const extension = path.extname(entry.name).toLowerCase();

      return extension === ".md" || extension === ".pdf";
    })
    .map((entry) => entry.name)
    .sort();

  const documents: PolicyDocument[] = [];

  for (const filename of supportedFiles) {
    const filePath = path.join(POLICY_DIRECTORY, filename);

    try {
      const extension = path.extname(filename).toLowerCase();

      const content =
        extension === ".pdf"
          ? await extractPdfText(filePath)
          : await fs.readFile(filePath, "utf-8").then((text) => text.trim());

      if (!content) {
        console.warn(
          `Skipping empty or textless policy document: ${filename}`
        );
        continue;
      }

      const documentId =
        EXISTING_POLICY_IDS[filename] ??
        generateDocumentId(filename);

      documents.push({
        documentId,
        title: generateTitle(filename, content),
        content,
        source: filename,
      });

    } catch (error) {
      console.error(
        `Failed to load policy document ${filename}:`,
        error
      );
    }
  }

  return documents;
}
