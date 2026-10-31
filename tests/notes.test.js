const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { matches } = require("../lib/store");

// Loads a fresh copy of the store that writes to a temp file.
function freshStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "notes-"));
  process.env.NOTES_FILE = path.join(dir, "notes.json");
  const storePath = require.resolve("../lib/store");
  delete require.cache[storePath];
  return { dir, store: require("../lib/store") };
}

const notes = [
  { id: 1, text: "buy milk" },
  { id: 2, text: "call the bank" },
  { id: 3, text: "milk the almonds" },
];

test("search finds every note that contains the term", () => {
  const result = matches(notes, "milk");
  assert.strictEqual(result.length, 2);
});

test("search finds a single containing note", () => {
  const result = matches(notes, "bank");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 2);
});

test("search returns nothing when no note contains the term", () => {
  const result = matches(notes, "xyz");
  assert.strictEqual(result.length, 0);
});

test("edit updates an existing note and returns true", () => {
  const { dir, store } = freshStore();
  const note = store.add("buy milk");
  assert.strictEqual(store.edit(note.id, "buy oat milk"), true);
  assert.strictEqual(store.all()[0].text, "buy oat milk");
  fs.rmSync(dir, { recursive: true });
});

test("edit returns false for an unknown id instead of throwing", () => {
  const { dir, store } = freshStore();
  store.add("buy milk");
  assert.strictEqual(store.edit(99, "hello"), false);
  assert.strictEqual(store.edit(NaN, "hello"), false);
  assert.strictEqual(store.all()[0].text, "buy milk");
  fs.rmSync(dir, { recursive: true });
});
