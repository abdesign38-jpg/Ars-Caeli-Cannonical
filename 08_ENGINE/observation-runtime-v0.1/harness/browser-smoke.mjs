const state = document.querySelector("#state");
const output = document.querySelector("#output");
const start = document.querySelector("#start");
const onset = document.querySelector("#onset");
const choices = [...document.querySelectorAll("[data-choice-id]")];
const marker = document.querySelector("#marker");

let session = null;

function render(value) {
  state.textContent = session ? `Session state: ${session.state}` : "No session loaded.";
  output.textContent = JSON.stringify(value, null, 2);
}

start.addEventListener("click", async () => {
  render({ notice: "Connect ObservationRuntime here for a development-only session." });
  onset.disabled = false;
  choices.forEach((button) => { button.disabled = false; });
  marker.disabled = false;
});

onset.addEventListener("click", () => render({ event: "stimulus_onset", boundary: "presentation adapter" }));
choices.forEach((button) => button.addEventListener("click", () => render({ event: "response_captured", choice_id: button.dataset.choiceId })));
marker.addEventListener("click", () => render({ event: "context_marker_recorded", projection_policy: "journal_only" }));
