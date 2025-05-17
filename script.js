document.addEventListener("DOMContentLoaded", () => {
  restoreProgress();

  const photoInput = document.getElementById("photo");
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (file && file.size <= 2 * 1024 * 1024 && /image\/(jpeg|png)/.test(file.type)) {
      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById("preview");
        preview.src = e.target.result;
        preview.classList.remove("hidden");
        localStorage.setItem("photoBase64", e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Invalid file. Must be JPG/PNG and less than 2MB.");
      photoInput.value = "";
      document.getElementById("preview").classList.add("hidden");
      localStorage.removeItem("photoBase64");
    }
  });

  const entryForm = document.getElementById("entry-form");
  entryForm.addEventListener("submit", e => {
    e.preventDefault();
    ["surname", "firstname", "othername"].forEach(id => {
      const el = document.getElementById(id);
      el.value = el.value.toUpperCase();
    });

    saveUserDetails();

    entryForm.classList.add("hidden");
    document.getElementById("quiz-section").classList.remove("hidden");
    loadQuiz();
  });

  window.addEventListener("beforeunload", (event) => {
    if (localStorage.getItem("quizStarted") === "true") {
      event.preventDefault();
      event.returnValue = "";
    }
  });
});

function saveUserDetails() {
  const fields = ["surname", "firstname", "othername", "admission", "form", "stream"];
  fields.forEach(f => {
    const el = document.getElementById(f);
    localStorage.setItem(f, el.value);
  });
  localStorage.setItem("quizStarted", "true");
}

function restoreProgress() {
  const fields = ["surname", "firstname", "othername", "admission", "form", "stream"];
  let anyData = false;
  fields.forEach(f => {
    const val = localStorage.getItem(f);
    if (val) {
      const el = document.getElementById(f);
      if(el) el.value = val;
      anyData = true;
    }
  });

  const photoBase64 = localStorage.getItem("photoBase64");
  if (photoBase64) {
    const preview = document.getElementById("preview");
    preview.src = photoBase64;
    preview.classList.remove("hidden");
  }

  if (anyData) {
    document.getElementById("entry-form").classList.remove("hidden");
  }
}

let timerInterval;
let timeLeft;
let questionsData = [];

function loadQuiz() {
  fetch('questions.txt')
    .then(response => response.text())
    .then(text => {
      questionsData = parseQuestions(text);
      renderQuiz(questionsData);
      restoreAnswers();

      let savedTime = localStorage.getItem("timeLeft");
      timeLeft = savedTime ? parseInt(savedTime, 10) : questionsData.length * 30;
      startTimer(timeLeft);

      addSubmitButton();

      document.getElementById("quiz-container").addEventListener("change", saveAnswers);
    })
    .catch(error => console.error("Failed to load questions:", error));
}

function parseQuestions(text) {
  // Assuming questions.txt format: one question per line in a certain format, e.g.,
  // Q|Question text?|A) option1|B) option2|C) option3|D) option4|AnswerLetter
  // This function needs to parse that format into {question, choices:[], answer} objects
  const lines = text.trim().split('\n');
  return lines.map(line => {
    const parts = line.split('|');
    const question = parts[1];
    const choices = parts.slice(2, 6);
    const answer = parts[6].trim();
    return { question, choices, answer };
  });
}

function renderQuiz(questions) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";
  questions.forEach((q, i) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question-block";
    let html = `<p><strong>Q${i+1}.</strong> ${q.question}</p>`;
    q.choices.forEach((choice, idx) => {
      const val = String.fromCharCode(65 + idx); // A, B, C, D
      html += `
      <label>
        <input type="radio" name="question${i}" value="${val}">
        ${choice}
      </label><br>`;
    });
    qDiv.innerHTML = html;
    container.appendChild(qDiv);
  });
}

function saveAnswers() {
  let answers = {};
  questionsData.forEach((_, i) => {
    const selected = document.querySelector(`input[name=question${i}]:checked`);
    answers[`question${i}`] = selected ? selected.value : "";
  });
  localStorage.setItem("answers", JSON.stringify(answers));
}

function restoreAnswers() {
  const savedAnswers = localStorage.getItem("answers");
  if (savedAnswers) {
    const answers = JSON.parse(savedAnswers);
    for (const [key, val] of Object.entries(answers)) {
      if(val){
        const input = document.querySelector(`input[name=${key}][value=${val}]`);
        if(input) input.checked = true;
      }
    }
  }
}

function startTimer(duration) {
  const timerDisplay = document.getElementById("timer");
  timeLeft = duration;
  timerDisplay.textContent = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = formatTime(timeLeft);
    localStorage.setItem("timeLeft", timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      disableQuiz();
      showResultsAndSendEmail();
    }
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

function disableQuiz() {
  const inputs = document.querySelectorAll("#quiz-container input[type=radio]");
  inputs.forEach(input => input.disabled = true);
  const submitBtn = document.getElementById("manual-submit");
  if(submitBtn) submitBtn.disabled = true;

  localStorage.clear();
}

function addSubmitButton() {
  const container = document.getElementById("quiz-container");
  let btn = document.getElementById("manual-submit");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "manual-submit";
    btn.textContent = "Submit Quiz";
    btn.type = "button";
    btn.style.marginTop = "1em";
    btn.addEventListener("click", () => {
      clearInterval(timerInterval);
      disableQuiz();
      showResultsAndSendEmail();
    });
    container.appendChild(btn);
  }
}

function showResultsAndSendEmail() {
  alert("Time is up or quiz submitted! Sending results via email...");
  sendMailto();
}

function sendMailto() {
  const surname = localStorage.getItem("surname") || "";
  const firstname = localStorage.getItem("firstname") || "";
  const othername = localStorage.getItem("othername") || "";
  const admission = localStorage.getItem("admission") || "";
  const form = localStorage.getItem("form") || "";
  const stream = localStorage.getItem("stream") || "";
  const photoBase64 = localStorage.getItem("photoBase64") || "";

  let body = `Surname: ${surname}\nFirst Name: ${firstname}\nOther Name: ${othername}\nAdmission No: ${admission}\nForm: ${form}\nStream: ${stream}\n\nAnswers:\n`;

  questionsData.forEach((q, i) => {
    const userAnswer = document.querySelector(`input[name=question${i}]:checked`);
    const userVal = userAnswer ? userAnswer.value : "No Answer";
    body += `Q${i + 1}: ${userVal} (Correct: ${q.answer})\n`;
  });

  if(photoBase64){
    body += `\n--- Photo Preview (Base64) ---\n${photoBase64}\n`;
  }

  const mailtoLink = `mailto:ngathosec9@gmail.com?subject=Support%20and%20Movement%20Quiz%20Results&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}
