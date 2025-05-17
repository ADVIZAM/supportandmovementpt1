document.addEventListener("DOMContentLoaded", () => {
  fetch("questions.json")
    .then(response => response.json())
    .then(data => renderQuestions(data))
    .catch(error => console.error("Error loading questions:", error));
});

function renderQuestions(questions) {
  const container = document.getElementById("quiz-container");
  questions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.classList.add("p-4", "bg-white", "rounded", "shadow");

    const qText = document.createElement("p");
    qText.classList.add("font-semibold");
    qText.textContent = `${index + 1}. ${q.question}`;
    qDiv.appendChild(qText);

    q.choices.forEach(choice => {
      const label = document.createElement("label");
      label.classList.add("block", "ml-4");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question${index}`;
      input.value = choice;
      input.classList.add("mr-2");

      label.appendChild(input);
      label.appendChild(document.createTextNode(choice));
      qDiv.appendChild(label);
    });

    container.appendChild(qDiv);
  });
}
