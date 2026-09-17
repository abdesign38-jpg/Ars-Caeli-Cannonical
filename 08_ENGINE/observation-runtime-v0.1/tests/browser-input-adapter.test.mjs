import test from "node:test";
import assert from "node:assert/strict";

import { BrowserInputAdapter } from "../src/adapters/browser-input-adapter.mjs";

class Target {
  #listeners = new Map();
  addEventListener(type, listener) { const list = this.#listeners.get(type) ?? []; list.push(listener); this.#listeners.set(type, list); }
  removeEventListener(type, listener) { this.#listeners.set(type, (this.#listeners.get(type) ?? []).filter((candidate) => candidate !== listener)); }
  dispatch(type, event) { for (const listener of this.#listeners.get(type) ?? []) listener(event); }
  count(type) { return this.#listeners.get(type)?.length ?? 0; }
}

test("captures only the first valid keyboard/pointer/touch choice and detaches listeners", () => {
  const target = new Target();
  const choices = [{ choice_id: "left", key: "ArrowLeft" }, { choice_id: "right", key: "ArrowRight" }];
  const captured = [];
  const adapter = new BrowserInputAdapter({ target, choices, onChoice: (choice) => captured.push(choice) });
  adapter.arm();
  target.dispatch("keydown", { key: "Escape" });
  target.dispatch("keydown", { key: "ArrowLeft" });
  target.dispatch("keydown", { key: "ArrowRight" });
  assert.deepEqual(captured, [{ choiceId: "left", inputModality: "keyboard" }]);
  assert.equal(target.count("keydown"), 0);
  assert.equal(target.count("click"), 0);
});

test("supports abort-signal cleanup and pointer/touch modality", () => {
  const target = new Target();
  const controller = new AbortController();
  const captured = [];
  const adapter = new BrowserInputAdapter({ target, choices: [{ choice_id: "left" }], onChoice: (choice) => captured.push(choice) });
  adapter.arm({ signal: controller.signal });
  controller.abort();
  target.dispatch("click", { choiceId: "left" });
  assert.deepEqual(captured, []);
  adapter.arm();
  target.dispatch("touchend", { choiceId: "left" });
  assert.deepEqual(captured, [{ choiceId: "left", inputModality: "touch" }]);
});
