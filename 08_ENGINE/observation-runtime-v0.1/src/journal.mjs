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
    if (!event || typeof event !== "object" || !event.eventId || !event.type) {
      throw new ObservationRuntimeError(
        "EVENT_INVALID",
        "Journal events require eventId and type.",
      );
    }
    if (this.#eventIds.has(event.eventId)) {
      throw new ObservationRuntimeError(
        "DUPLICATE_RECORD_COMMIT",
        `Duplicate journal event: ${event.eventId}`,
        { eventId: event.eventId },
      );
    }

    const committed = Object.freeze({
      ...clone(event),
      seq: this.#events.length + 1,
    });
    this.#events.push(committed);
    this.#eventIds.add(event.eventId);
    return clone(committed);
  }

  list() {
    return clone(this.#events);
  }

  replay(reducer, initialState) {
    return this.list().reduce(reducer, clone(initialState));
  }
}
