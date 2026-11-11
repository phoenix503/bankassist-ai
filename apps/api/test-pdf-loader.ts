import { loadPolicyDocuments } from "./src/lib/rag/document-loader";

async function test() {
  const documents = await loadPolicyDocuments();

  console.log("Total documents:", documents.length);

  for (const document of documents) {
    console.log("\n----------------------------");

    console.log({
      documentId: document.documentId,
      title: document.title,
      source: document.source,
      contentLength: document.content.length,
      preview: document.content.substring(0, 200),
    });
  }
}

test().catch(console.error);
