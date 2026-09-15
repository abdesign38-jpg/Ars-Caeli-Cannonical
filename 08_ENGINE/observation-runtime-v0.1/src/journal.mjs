import { ObservationRuntimeError } from "./errors.mjs";

function clone(value) {
  return structuredClone(value);
}

export class Journal {
  #events = [];
  #eventIds = new Set();

  clone() {
    const copy = new Journal();
    for (const event of this.#events) {
      copy.append(event);
    }
    return copy;
  }

  append(event) {
    if (!event || typeof event !== "object" || !event.event_id || !event.event_type) {
      throw new ObservationRuntimeError(
        "EVENT_INVALID",
        "Journal events require event_id and event_type.",
      );
    }
    if (this.#eventIds.has(event.event_id)) {
      throw new ObservationRuntimeError(
        "DUPLICATE_RECORD_COMMIT",
        `Duplicate journal event: ${event.event_id}`,
        { event_id: event.event_id },
      );
    }

    const committed = Object.freeze({
      ...clone(event),
      seq: this.#events.length,
    });
    this.#events.push(committed);
    this.#eventIds.add(event.event_id);
    return clone(committed);
  }

  list() {
    return clone(this.#events);
  }

  replay(reducer, initialState) {
    return this.list().reduce(reducer, clone(initialState));
  }
}
