export class ObservationStore {
  async createSession() {
    throw new Error("ObservationStore.createSession must be implemented by a storage adapter.");
  }

  async transact() {
    throw new Error("ObservationStore.transact must be implemented by a storage adapter.");
  }

  async loadSession() {
    throw new Error("ObservationStore.loadSession must be implemented by a storage adapter.");
  }

  async listEvents() {
    throw new Error("ObservationStore.listEvents must be implemented by a storage adapter.");
  }

  async loadProjection() {
    throw new Error("ObservationStore.loadProjection must be implemented by a storage adapter.");
  }

  async loadArtifactSnapshot() {
    throw new Error("ObservationStore.loadArtifactSnapshot must be implemented by a storage adapter.");
  }
}
