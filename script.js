document.addEventListener("DOMContentLoaded", () => {
  fetch('questions.txt')
    .then(response => response.text())
    .then(text => parseAndRender(text))
    .catch(error => console.error("Failed to load questions:", error));
});

function parseAndRender(text) {
  const blocks = text.trim().split(/\n\s*\n/); // split by blank lines
  const container = document.getElementById("quiz-container");

  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    const question = lines.find(line => line.startsWith('Q:')).slice(2).trim();
    const options = lines.filter(line => /^[A-D]:/.test(line))
                         .map(line => ({
                           key: line[0],
                           text: line.slice(2).trim()
                         }));
    const answer = lines.find(line => line.startsWith('ANS:')).slice(4).trim();

    const qDiv = document.createElement("div");
    qDiv.classList.add("p-4", "bg-white", "rounded", "shadow");

    const qText = document.createElement("p");
    qText.classList.add("font-semibold");
    qText.textContent = `${index + 1}. ${question}`;
    qDiv.appendChild(qText);

    options.forEach(opt => {
      const label = document.createElement("label");
      label.classList.add("block", "ml-4");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question${index}`;
      input.value = opt.key;
      input.classList.add("mr-2");

      label.appendChild(input);
      label.appendChild(document.createTextNode(`${opt.key}. ${opt.text}`));
      qDiv.appendChild(label);
    });

    container.appendChild(qDiv);
  });
}
