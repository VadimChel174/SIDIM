// ==============================================
// НАСТРОЙКИ — здесь можно поменять ссылки и имя
// ==============================================
const CONFIG = {
  businessName: "МИДиС",
  yandexReviewUrl: "https://yandex.ru/maps/-/CTW2FDzW",
  webhookUrl:
    "https://script.google.com/macros/s/AKfycbzib6GO13DRXFQSYYgyig9qliMR4cHbznMv7jO1Qhh6R3sfY6PECs5BUrLHdVFlMc-YOg/exec",
  clientId: "midis-visit",
  redirectDelay: 1900,
};

const ratingCopy = [
  "Совсем не то",
  "Есть вопросы",
  "Нормально",
  "Мне понравилось",
  "Это было супер!",
];

const ratingPanel = document.getElementById("ratingPanel");
const feedbackPanel = document.getElementById("feedbackPanel");
const resultPanel = document.getElementById("resultPanel");
const stars = Array.from(document.querySelectorAll(".star"));
const ratingStatus = document.getElementById("ratingStatus");
const reasonButtons = Array.from(document.querySelectorAll(".reason"));
const comment = document.getElementById("comment");
const sendFeedbackButton = document.getElementById("sendFeedback");
const restartButton = document.getElementById("restartButton");
const yandexButton = document.getElementById("yandexButton");
const mascot = document.getElementById("mascot");
const speechBubble = document.getElementById("speechBubble");
const stepNumber = document.getElementById("stepNumber");
const stepName = document.getElementById("stepName");
const resultKicker = document.getElementById("resultKicker");
const resultTitle = document.getElementById("resultTitle");
const resultCopy = document.getElementById("resultCopy");

let chosenRating = 0;
let redirectTimer = null;

function paintStars(value) {
  stars.forEach((star, index) => {
    star.classList.toggle("active", index < value);
  });

  ratingStatus.textContent = value
    ? ratingCopy[value - 1]
    : "Выбери одну из пяти звёзд";
  ratingStatus.classList.toggle("has-rating", Boolean(value));
}

function showOnly(panel) {
  [ratingPanel, feedbackPanel, resultPanel].forEach((item) => {
    item.classList.toggle("hidden", item !== panel);
  });
}

function setMascot(mode) {
  const isThankYou = mode === "thanks" || mode === "redirect";

  mascot.src = isThankYou
    ? "assets/mascot-thanks.png"
    : "assets/mascot.png";
  mascot.className = `mascot mascot-${mode}`;

  if (mode === "feedback") {
    speechBubble.textContent = "Расскажи, что улучшить";
  } else if (isThankYou) {
    speechBubble.textContent = "Спасибо! Ты супер";
  } else {
    speechBubble.textContent = "Жми на звёзды";
  }
}

function logFeedback(rating, feedback = "") {
  if (!CONFIG.webhookUrl) return;

  const payload = {
    clientId: CONFIG.clientId,
    businessName: CONFIG.businessName,
    rating,
    feedback,
    timestamp: new Date().toISOString(),
  };

  fetch(CONFIG.webhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

function chooseRating(value) {
  chosenRating = value;
  stars.forEach((star) => {
    star.setAttribute(
      "aria-pressed",
      String(Number(star.dataset.rating) === value),
    );
  });
  paintStars(value);
  logFeedback(value);

  if (value >= 4) {
    showRedirectResult();
    return;
  }

  window.setTimeout(() => {
    showOnly(feedbackPanel);
    stepNumber.textContent = "02";
    stepName.textContent = "Детали";
    setMascot("feedback");
  }, 260);
}

function showRedirectResult() {
  showOnly(resultPanel);
  stepNumber.textContent = "01";
  stepName.textContent = "Оценка визита";
  resultKicker.textContent = "Остался один шаг";
  resultTitle.textContent = "Спасибо за высокую оценку!";
  resultCopy.textContent =
    "Сейчас откроем Яндекс.Карты. Твой отзыв поможет будущим студентам узнать нас лучше.";
  yandexButton.href = CONFIG.yandexReviewUrl;
  yandexButton.classList.remove("hidden");
  restartButton.classList.add("hidden");
  setMascot("redirect");

  redirectTimer = window.setTimeout(() => {
    window.location.assign(CONFIG.yandexReviewUrl);
  }, CONFIG.redirectDelay);
}

function submitDetails() {
  const selectedReasons = reasonButtons
    .filter((button) => button.classList.contains("selected"))
    .map((button) => button.dataset.label);

  const details = [
    selectedReasons.length
      ? `Что можно улучшить: ${selectedReasons.join(", ")}.`
      : "",
    comment.value.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  logFeedback(chosenRating, details);

  showOnly(resultPanel);
  stepNumber.textContent = "02";
  stepName.textContent = "Готово";
  resultKicker.textContent = "Ответ отправлен";
  resultTitle.textContent = "Спасибо, что помог нам";
  resultCopy.textContent =
    "Команда МИДиС увидит твою оценку и комментарий. Каждый ответ помогает становиться лучше.";
  yandexButton.classList.add("hidden");
  restartButton.classList.remove("hidden");
  setMascot("thanks");
}

function restart() {
  if (redirectTimer) {
    window.clearTimeout(redirectTimer);
    redirectTimer = null;
  }

  chosenRating = 0;
  comment.value = "";
  stars.forEach((star) => star.setAttribute("aria-pressed", "false"));
  reasonButtons.forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = button.dataset.label;
  });

  paintStars(0);
  showOnly(ratingPanel);
  stepNumber.textContent = "01";
  stepName.textContent = "Оценка визита";
  setMascot("rating");
}

stars.forEach((star) => {
  const value = Number(star.dataset.rating);
  star.setAttribute("aria-pressed", "false");

  star.addEventListener("mouseenter", () => paintStars(value));
  star.addEventListener("focus", () => paintStars(value));
  star.addEventListener("mouseleave", () => paintStars(chosenRating));
  star.addEventListener("blur", () => paintStars(chosenRating));
  star.addEventListener("click", () => chooseRating(value));
});

reasonButtons.forEach((button) => {
  button.dataset.label = button.textContent.trim();
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", () => {
    const selected = button.classList.toggle("selected");
    button.setAttribute("aria-pressed", String(selected));
    button.innerHTML = selected
      ? `<span aria-hidden="true">✓</span>${button.dataset.label}`
      : button.dataset.label;
  });
});

sendFeedbackButton.addEventListener("click", submitDetails);
restartButton.addEventListener("click", restart);

paintStars(0);
