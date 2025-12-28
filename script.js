document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'habit_pro_v5';
  let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  let weeklyChart = null;
  let streakLineChart = null;
  let completionPieChart = null;

  // Elements
  const habitGrid = document.getElementById('habit-grid');
  const habitInput = document.getElementById('habit-input');
  const habitCategory = document.getElementById('habit-category');
  const habitColor = document.getElementById('habit-color');
  const modal = document.getElementById('modal-overlay');
  const toast = document.getElementById('toast');

  const todayStr = () => new Date().toDateString();

  // Quotes
  const quotes = [
    'Small steps, big change.',
    'Consistency beats intensity.',
    'You don’t need motivation, you need a system.',
    'Win the day, one habit at a time.',
    'Tiny gains compound into big wins.',
    'Discipline is remembering what you want.'
  ];

  function init() {
    document.getElementById('current-date').innerText =
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    document.getElementById('daily-quote').innerText =
      quotes[Math.floor(Math.random() * quotes.length)];

    refreshUI();
    startReminderEngine();
  }

  // 🔔 Reminder engine
  function startReminderEngine() {
    setInterval(() => {
      const today = todayStr();
      const pending = habits.filter(h => h.lastDate !== today);

      if (pending.length && Notification.permission === 'granted') {
        pending.forEach(h => {
          new Notification("HabitPro Reminder", {
            body: `Don't forget to ${h.name}!`,
            icon: "https://cdn-icons-png.flaticon.com/512/3176/3176298.png"
          });
        });
      }
    }, 60000);
  }

  // ✅ Toggle habit (DAILY RESET SAFE)
  window.toggleHabit = (id) => {
    const habit = habits.find(h => h.id === id);
    const today = todayStr();

    if (habit.lastDate === today) {
      showToast("Already completed today", "error");
      return;
    }

    habit.lastDate = today;

    if (!habit.history) habit.history = [];
    if (!habit.history.includes(today)) {
      habit.history.push(today);
      habit.streak++;
    }

    save(`Marked "${habit.name}"`, "success");
  };

  window.deleteHabit = (id) => {
    if (confirm("Delete this habit?")) {
      habits = habits.filter(h => h.id !== id);
      save("Habit deleted", "success");
    }
  };

  function save(message, type) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    refreshUI();
    showToast(message, type);
  }

  function refreshUI() {
    habitGrid.innerHTML = habits.length === 0
      ? `<p style="grid-column:1/-1;text-align:center;color:#94a3b8;">Add a habit to start tracking</p>`
      : '';

    habits.forEach(h => {
      const doneToday = h.lastDate === todayStr();

      const div = document.createElement('div');
      div.className = 'habit-card';
      div.innerHTML = `
        <button class="delete-btn" onclick="deleteHabit(${h.id})">&times;</button>
        <div class="habit-header">
          <span class="habit-badge" style="color:${h.color}">🔥 Streak: ${h.streak}</span>
          <span class="category-tag">${h.category}</span>
        </div>
        <h3 class="habit-name" style="color:${h.color}">${h.name}</h3>
        <button class="check-btn ${doneToday ? 'done' : ''}" onclick="toggleHabit(${h.id})">
          ${doneToday ? '✓ Completed' : 'Mark as done'}
        </button>
      `;
      habitGrid.appendChild(div);
    });

    updateDashboard();
    renderWeeklyChart();
    renderStreakLineChart();
    renderCompletionPieChart();
  }

  function updateDashboard() {
    document.getElementById('today-count').innerText =
      habits.filter(h => h.lastDate === todayStr()).length;

    document.getElementById('total-habits').innerText = habits.length;
    document.getElementById('best-streak').innerText =
      habits.length ? Math.max(...habits.map(h => h.streak)) : 0;
  }

  // 📊 Charts (original logic preserved)
  function renderWeeklyChart() {
    if (weeklyChart) weeklyChart.destroy();
    const ctx = document.getElementById('analyticsChart').getContext('2d');

    const labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const data = labels.map(day =>
      habits.reduce((sum, h) =>
        h.history?.some(d => new Date(d).getDay() === labels.indexOf(day))
          ? sum + 1 : sum, 0)
    );

    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: '#4f46e5' }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function renderStreakLineChart() {
    if (streakLineChart) streakLineChart.destroy();
    const ctx = document.getElementById('streakLineChart').getContext('2d');

    streakLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: habits.map(h => h.name),
        datasets: [{ data: habits.map(h => h.streak), borderColor: '#7c3aed' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function renderCompletionPieChart() {
    if (completionPieChart) completionPieChart.destroy();
    const ctx = document.getElementById('completionPieChart').getContext('2d');

    const completed = habits.filter(h => h.lastDate === todayStr()).length;

    completionPieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [{ data: [completed, habits.length - completed] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function showToast(msg, type) {
    toast.className = `toast show ${type}`;
    toast.textContent = msg;
    setTimeout(() => toast.className = 'toast', 1800);
  }

  // 🔘 Buttons
  document.getElementById('save-habit').onclick = () => {
    const name = habitInput.value.trim();
    if (!name) return showToast("Enter habit name", "error");

    habits.push({
      id: Date.now(),
      name,
      category: habitCategory.value,
      color: habitColor.value,
      streak: 0,
      lastDate: null,
      history: []
    });

    save("Habit added", "success");
    habitInput.value = '';
    modal.classList.remove('show');
  };

  document.getElementById('open-modal').onclick = () => modal.classList.add('show');
  document.getElementById('close-modal').onclick = () => modal.classList.remove('show');

  document.getElementById('toggle-theme').onclick = () => {
    document.body.classList.toggle('dark');
    showToast(document.body.classList.contains('dark') ? 'Dark mode on' : 'Light mode on', 'success');
  };

  document.getElementById('enable-notifications').onclick = async () => {
    const permission = await Notification.requestPermission();
    showToast(permission === 'granted' ? 'Notifications enabled' : 'Notifications blocked',
      permission === 'granted' ? 'success' : 'error');
  };

  modal.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') modal.classList.remove('show');
  });

  init();
});
