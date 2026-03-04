// js/main.js

const EVENT = {
  date: { day: 28, month: 2, year: 2026 }, // 0=Jan
  time: { hour: 14, minute: 0 },
};

const STORAGE = {
  votes: 'genderPartyVotes_v5',
  fio: 'guestFio_v5',
  attendance: 'guestAttendance_v5'
};

const pad2 = (n) => String(n).padStart(2, '0');

// ===== Фоны секций: делаем абсолютный URL, чтобы не было /css/assets/... =====
function initSectionBackgrounds() {
  document.querySelectorAll('.page[data-bg]').forEach(section => {
    const bg = section.getAttribute('data-bg');
    const absUrl = new URL(bg, window.location.href).href;
    section.style.setProperty('--bg-image', `url("${absUrl}")`);
  });
}

// ===== Скролл =====
function initScroll() {
  const pages = document.querySelectorAll('.page');
  const go = (i) => pages[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const b1 = document.getElementById('scrollButton1');
  const b2 = document.getElementById('scrollButton2');

  if (b1) b1.addEventListener('click', (e)=>{ e.preventDefault(); go(1); });
  if (b2) b2.addEventListener('click', (e)=>{ e.preventDefault(); go(2); });
}

// ===== Календарь =====
function renderCalendar() {
  const grid = document.getElementById('calendarDays');
  if (!grid) return;

  const { day: highlightDay, month, year } = EVENT.date;
  grid.innerHTML = '';

  const firstDate = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const jsDay = firstDate.getDay();      // 0=Sun..6=Sat
  const firstIndex = (jsDay + 6) % 7;    // 0=Mon..6=Sun

  for (let i = 0; i < firstIndex; i++) {
    const d = document.createElement('div');
    d.className = 'calendar-day empty';
    grid.appendChild(d);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'calendar-day';
    el.textContent = d;

    const date = new Date(year, month, d);
    const dow = date.getDay();

    if (dow === 0 || dow === 6) el.classList.add('weekend');
    if (isCurrentMonth && today.getDate() === d) el.classList.add('current');
    if (d === highlightDay) el.classList.add('future');

    grid.appendChild(el);
  }
}

// ===== Таймер =====
function startTimer() {
  const target = new Date(
    EVENT.date.year,
    EVENT.date.month,
    EVENT.date.day,
    EVENT.time.hour,
    EVENT.time.minute,
    0
  ).getTime();

  const elDays = document.getElementById('days');
  const elHours = document.getElementById('hours');
  const elMinutes = document.getElementById('minutes');
  const elSeconds = document.getElementById('seconds');
  const timerGrid = document.getElementById('timer');
  if (!elDays || !elHours || !elMinutes || !elSeconds || !timerGrid) return;

  const update = () => {
    const now = Date.now();
    let diff = target - now;

    if (diff <= 0) {
      timerGrid.innerHTML = `<div class="small center"><b>🎉 Событие началось!</b></div>`;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff %= (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff %= (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff %= (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    elDays.textContent = pad2(days);
    elHours.textContent = pad2(hours);
    elMinutes.textContent = pad2(minutes);
    elSeconds.textContent = pad2(seconds);
  };

  update();
  setInterval(update, 1000);
}

// ===== Голосование (2 bubble + 1 wide) =====
function initVoting() {
  const note = document.getElementById('voteNote');

  const counts = {
    boy: document.getElementById('boyCount'),
    girl: document.getElementById('girlCount'),
    twins: document.getElementById('twinsCount')
  };

  let votes = { boy: 0, girl: 0, twins: 0 };

  const saved = localStorage.getItem(STORAGE.votes);
  if (saved) {
    try { votes = { ...votes, ...JSON.parse(saved) }; } catch(_) {}
  }

  const render = () => {
    counts.boy && (counts.boy.textContent = votes.boy);
    counts.girl && (counts.girl.textContent = votes.girl);
    counts.twins && (counts.twins.textContent = votes.twins);
  };

  const save = () => localStorage.setItem(STORAGE.votes, JSON.stringify(votes));

  const flash = (message) => {
    if (!note) return;
    const old = note.textContent;
    note.textContent = message;
    note.style.color = '#b7902f';
    setTimeout(() => {
      note.textContent = old;
      note.style.color = '';
    }, 1700);
  };

  // bubble + wide
  const allButtons = document.querySelectorAll('.bubble, .bubble-wide');
  allButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gender = btn.dataset.gender;
      if (!gender || !(gender in votes)) return;

      allButtons.forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');

      votes[gender] += 1;
      save();
      render();

      const msg = gender === 'boy' ? '🩵 Голос за мальчика!' :
                  gender === 'girl' ? '🩷 Голос за девочку!' :
                  '👯 Голос за двойню!';
      flash(msg);
    });
  });

  render();
}

// ===== Wish List =====
function initWishlist() {
  const btn = document.getElementById('wishlistButton');
  if (!btn) return;

  const url = 'https://t.me/+tH9JAQ64nP0wOTIy';
  btn.setAttribute('href', url);
  btn.setAttribute('target', '_blank');
  btn.setAttribute('rel', 'noopener');
}

// ===== RSVP =====
function initRSVP() {
  const fioInput = document.getElementById('fioInput');
  const savedFio = document.getElementById('savedFio');
  const submit = document.getElementById('submitAttendance');
  const status = document.getElementById('attendanceStatus');

  if (!fioInput || !submit || !status) return;

  const fioSaved = localStorage.getItem(STORAGE.fio);
  if (fioSaved) {
    fioInput.value = fioSaved;
    if (savedFio) {
      savedFio.textContent = `Сохранено: ${fioSaved}`;
      savedFio.classList.add('show');
    }
  }

  const attSaved = localStorage.getItem(STORAGE.attendance);
  if (attSaved) {
    const radio = document.querySelector(`input[name="attendance"][value="${attSaved}"]`);
    if (radio) radio.checked = true;
    showAttendanceStatus(attSaved);
  }

  function isValidFio(v) {
    return v.trim().length >= 3;
  }

  function showAttendanceStatus(value) {
    status.className = 'status';
    if (value === 'yes') {
      status.classList.add('ok');
      status.textContent = 'Ждём вас 💛';
    } else if (value === 'no') {
      status.classList.add('no');
      status.textContent = 'Спасибо за ответ';
    }
  }

  submit.addEventListener('click', () => {
    const v = fioInput.value.trim();
    if (!isValidFio(v)) {
      status.className = 'status info';
      status.textContent = 'Введите ваше ФИО';
      return;
    }
    localStorage.setItem(STORAGE.fio, v);
    if (savedFio) {
      savedFio.textContent = `Сохранено: ${v}`;
      savedFio.classList.add('show');
    }

    const selected = document.querySelector('input[name="attendance"]:checked');
    if (!selected) {
      status.className = 'status info';
      status.textContent = 'Выберите вариант присутствия';
      return;
    }

    localStorage.setItem(STORAGE.attendance, selected.value);
    showAttendanceStatus(selected.value);
  });
}

// ===== Плавное появление при прокрутке =====
function initReveal() {
  const els = Array.from(document.querySelectorAll('[data-animate]'));

  document.querySelectorAll('.page .content').forEach(content => {
    const items = Array.from(content.querySelectorAll('[data-animate]'));
    items.forEach((el, idx) => {
      const n = Math.min(5, idx + 1);
      el.classList.add(`delay-${n}`);
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

  els.forEach(el => io.observe(el));
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initSectionBackgrounds();
  initScroll();
  renderCalendar();
  startTimer();
  initVoting();
  initWishlist();
  initRSVP();
  initReveal();
});

function initVoting() {
  // ===== ВСТАВЬ СЮДА URL ВЕБ-АППА =====
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx881HZa35fKmp_NFfbtQCL6x96bJ3QCjPTWEH9llfWXavASE4nBwCjZdMHpcVG0__4FQ/exec";
  const EVENT_ID = "gender-party-2026-03-28";

  const note = document.getElementById("voteNote");

  const boyCount = document.getElementById("boyCount");
  const girlCount = document.getElementById("girlCount");
  const twinsCount = document.getElementById("twinsCount");

  const buttons = document.querySelectorAll(".bubble, .bubble-wide");

  // 1 голос на устройство (и ещё проверка на сервере)
  const DEVICE_KEY = `device_${EVENT_ID}`;
  const VOTED_KEY = `voted_${EVENT_ID}`;

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function setCounts(data) {
    if (boyCount) boyCount.textContent = data.boy ?? 0;
    if (girlCount) girlCount.textContent = data.girl ?? 0;
    if (twinsCount) twinsCount.textContent = data.twins ?? 0;
  }

  function flash(msg, ok = true) {
    if (!note) return;
    const old = note.textContent;
    note.textContent = msg;
    note.style.color = ok ? "#b7902f" : "#b04b56";
    setTimeout(() => {
      note.textContent = old;
      note.style.color = "";
    }, 2000);
  }

  function lockUI() {
    buttons.forEach(b => {
      b.disabled = true;
      b.style.opacity = "0.6";
      b.style.pointerEvents = "none";
    });
  }

  async function loadStats() {
    try {
      const url = `${SCRIPT_URL}?action=stats&event=${encodeURIComponent(EVENT_ID)}`;
      const r = await fetch(url, { cache: "no-store" });
      const data = await r.json();
      if (data.ok) setCounts(data);
    } catch (_) {}
  }

  async function sendVote(gender) {
    const device = getDeviceId();
    const url =
      `${SCRIPT_URL}?action=vote` +
      `&event=${encodeURIComponent(EVENT_ID)}` +
      `&gender=${encodeURIComponent(gender)}` +
      `&device=${encodeURIComponent(device)}`;

    const r = await fetch(url, { cache: "no-store" });
    const data = await r.json();

    // data: {ok:true/false, boy, girl, twins, message}
    if (data.boy != null) setCounts(data);

    if (!data.ok) {
      flash("Вы уже голосовали 💛", false);
      localStorage.setItem(VOTED_KEY, "1");
      lockUI();
      return;
    }

    flash("Голос принят ✅", true);
    localStorage.setItem(VOTED_KEY, "1");
    lockUI();
  }

  // Если уже голосовали на этом устройстве — блокируем и просто тянем общие
  if (localStorage.getItem(VOTED_KEY) === "1") {
    lockUI();
  }

  // первичная загрузка общих голосов
  loadStats();

  // автообновление, чтобы “другие люди видели голоса”
  setInterval(loadStats, 8000);

  // обработчики кликов
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const gender = btn.dataset.gender;
      if (!gender) return;

      if (localStorage.getItem(VOTED_KEY) === "1") {
        flash("Вы уже голосовали 💛", false);
        lockUI();
        return;
      }

      // выделение выбранного
      buttons.forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");

      sendVote(gender);
    });
  });
}