import { ObservationRuntimeError } from "../errors.mjs";

const MODALITIES = ["keyboard", "pointer", "touch"];

export class BrowserInputAdapter {
  #target;
  #choices;
  #onChoice;
  #cleanup = null;
  #resolved = false;

  constructor({ target = globalThis.document, choices, onChoice }) {
    if (!target?.addEventListener || !target?.removeEventListener) throw new ObservationRuntimeError("INPUT_ADAPTER_INVALID", "Input target must support event listeners.");
    if (!Array.isArray(choices) || choices.length === 0) throw new ObservationRuntimeError("CHOICE_NOT_ALLOWED", "At least one Probe choice is required.");
    if (typeof onChoice !== "function") throw new ObservationRuntimeError("INPUT_ADAPTER_INVALID", "onChoice callback is required.");
    this.#target = target;
    this.#choices = new Map(choices.map((choice) => [choice.choice_id, choice]));
    this.#onChoice = onChoice;
  }

  arm({ signal } = {}) {
    this.detach();
    this.#resolved = false;
    const listeners = [];
    const add = (type, handler, options) => {
      this.#target.addEventListener(type, handler, options);
      listeners.push(() => this.#target.removeEventListener(type, handler, options));
    };
    const resolve = (choiceId, inputModality) => {
      if (this.#resolved || !this.#choices.has(choiceId)) return;
      this.#resolved = true;
      this.detach();
      this.#onChoice({ choiceId, inputModality });
    };
    const keydown = (event) => {
      const choice = [...this.#choices.values()].find((item) => item.key === event.key || item.keyboard_key === event.key);
      if (choice) resolve(choice.choice_id, "keyboard");
    };
    const pointer = (event) => resolve(event.choiceId ?? event.currentTarget?.dataset?.choiceId, "pointer");
    const touch = (event) => resolve(event.choiceId ?? event.currentTarget?.dataset?.choiceId, "touch");
    add("keydown", keydown);
    add("click", pointer);
    add("touchend", touch);
    if (signal) {
      if (signal.aborted) this.detach();
      else signal.addEventListener("abort", () => this.detach(), { once: true });
    }
    this.#cleanup = () => {
      for (const remove of listeners) remove();
      this.#cleanup = null;
    };
  }

  detach() {
    this.#cleanup?.();
  }

  get supportedModalities() {
    return [...MODALITIES];
  }
}
