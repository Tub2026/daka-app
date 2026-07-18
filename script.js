const STORAGE_KEY = "daily-checkin-data";

const todayDateEl = document.getElementById("todayDate");
const checkinButton = document.getElementById("checkinButton");
const messageEl = document.getElementById("message");
const totalCountEl = document.getElementById("totalCount");
const currentStreakEl = document.getElementById("currentStreak");
const lastCheckinEl = document.getElementById("lastCheckin");
const historyListEl = document.getElementById("historyList");
const clearButton = document.getElementById("clearButton");
const goalInputEl = document.getElementById("goalInput");
const setGoalButton = document.getElementById("setGoalButton");
const goalDaysEl = document.getElementById("goalDays");
const goalProgressEl = document.getElementById("goalProgress");
const goalPercentEl = document.getElementById("goalPercent");
const weeklyListEl = document.getElementById("weeklyList");
const quoteTextEl = document.getElementById("quoteText");
const refreshQuoteButton = document.getElementById("refreshQuoteButton");
const badgeLabelEl = document.getElementById("badgeLabel");

const quotes = [
  "每天坚持一点点，习惯自然形成。",
  "一小步的坚持，成就长久的改变。",
  "别让今天的你，辜负昨天的努力。",
  "习惯不是一两天的事，而是每天的选择。",
  "做好今天的打卡，明天就更靠近目标。",
];

function formatDate(date) {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

function getIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { checkins: [], goal: 21 };

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return { checkins: data, goal: 21 };
    }
    const checkins = Array.isArray(data.checkins) ? data.checkins : [];
    const goal = typeof data.goal === "number" && data.goal > 0 ? data.goal : 21;
    return { checkins, goal };
  } catch (error) {
    return { checkins: [], goal: 21 };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function calculateStreak(checkins) {
  if (!checkins.length) return 0;

  const dates = new Set(checkins);
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  while (true) {
    const iso = getIsoDate(current);
    if (!dates.has(iso)) break;
    streak += 1;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

function getBadgeText(streak) {
  if (streak >= 30) return "火力全开🔥";
  if (streak >= 14) return "稳定前行💪";
  if (streak >= 7) return "习惯成型✨";
  if (streak >= 3) return "持续推进👍";
  return "开始你的第一步";
}

function getWeeklyStatus(checkins) {
  const dates = new Set(checkins);
  const week = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(current);
    date.setDate(date.getDate() - offset);
    const iso = getIsoDate(date);
    const label = date.toLocaleDateString("zh-CN", { weekday: "short" });
    week.push({ label, iso, done: dates.has(iso) });
  }

  return week;
}

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function updateUI() {
  const data = loadData();
  const checkins = data.checkins;
  const goal = data.goal;
  const today = getIsoDate(new Date());
  const lastCheckin = checkins.length ? checkins[checkins.length - 1] : null;
  const streak = calculateStreak(checkins);
  const percent = goal > 0 ? Math.min(100, Math.round((streak / goal) * 100)) : 0;

  todayDateEl.textContent = formatDate(new Date());
  totalCountEl.textContent = checkins.length;
  currentStreakEl.textContent = streak;
  lastCheckinEl.textContent = lastCheckin ? lastCheckin : "未打卡";
  goalDaysEl.textContent = goal;
  goalInputEl.value = goal;
  goalProgressEl.style.width = `${percent}%`;
  goalPercentEl.textContent = `${percent}%`;
  badgeLabelEl.textContent = getBadgeText(streak);

  const isTodayChecked = checkins.includes(today);
  checkinButton.textContent = isTodayChecked ? "已打卡" : "今日打卡";
  checkinButton.disabled = isTodayChecked;
  messageEl.textContent = isTodayChecked ? "今天已打卡，明天继续保持！" : "记得每天打卡，保持习惯。";

  weeklyListEl.innerHTML = "";
  const weeklyStatus = getWeeklyStatus(checkins);
  weeklyStatus.forEach(({ label, done }) => {
    const li = document.createElement("li");
    li.textContent = `${label}\n${done ? "✅" : "—"}`;
    if (done) li.classList.add("completed");
    weeklyListEl.appendChild(li);
  });

  historyListEl.innerHTML = "";
  if (!checkins.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "暂无打卡记录";
    historyListEl.appendChild(emptyItem);
  } else {
    [...checkins].reverse().forEach((date) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${date}</span><span>已打卡</span>`;
      historyListEl.appendChild(li);
    });
  }

  quoteTextEl.textContent = getRandomQuote();
}

function addCheckin() {
  const data = loadData();
  const checkins = data.checkins;
  const today = getIsoDate(new Date());

  if (checkins.includes(today)) {
    messageEl.textContent = "今天已经打过卡了。";
    return;
  }

  checkins.push(today);
  saveData({ ...data, checkins });
  messageEl.textContent = "打卡成功！继续保持习惯。";
  updateUI();
}

function setGoal() {
  const value = parseInt(goalInputEl.value, 10);
  const goal = Number.isNaN(value) || value < 1 ? 21 : value;
  const data = loadData();
  saveData({ ...data, goal });
  messageEl.textContent = `目标已更新为 ${goal} 天。`;
  updateUI();
}

function clearCheckins() {
  if (!confirm("确定要清空所有打卡记录吗？")) return;
  const data = loadData();
  saveData({ checkins: [], goal: data.goal });
  updateUI();
}

checkinButton.addEventListener("click", addCheckin);
setGoalButton.addEventListener("click", setGoal);
refreshQuoteButton.addEventListener("click", () => {
  quoteTextEl.textContent = getRandomQuote();
});
clearButton.addEventListener("click", clearCheckins);

updateUI();
