// =============================================
// PlanFlow – App Logic
// =============================================

// ---- STATE ----
const State = {
  projects: [],
  tasks: [],
  currentView: 'dashboard',
  kanbanProjectId: null,
  timelineProjectId: null,
  draggedTaskId: null,
};

// ---- LOCAL STORAGE ----
function saveData() {
  localStorage.setItem('planflow_projects', JSON.stringify(State.projects));
  localStorage.setItem('planflow_tasks', JSON.stringify(State.tasks));
}

function loadData() {
  try {
    State.projects = JSON.parse(localStorage.getItem('planflow_projects') || '[]');
    State.tasks = JSON.parse(localStorage.getItem('planflow_tasks') || '[]');
  } catch { State.projects = []; State.tasks = []; }
}

// ---- UTILS ----
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.className = 'toast', 2800);
}

// ---- PROJECT CALC ----
function getProjectProgress(pid) {
  const tasks = State.tasks.filter(t => t.projectId === pid);
  if (!tasks.length) return 0;
  const total = tasks.reduce((s, t) => s + (parseInt(t.progress) || 0), 0);
  return Math.round(total / tasks.length);
}

function getProjectTaskCount(pid) {
  return State.tasks.filter(t => t.projectId === pid).length;
}

// ---- STATUS HELPERS ----
function statusLabel(s) {
  return { todo: 'Cần Làm', inprogress: 'Đang Làm', review: 'Đánh Giá', done: 'Hoàn Thành' }[s] || s;
}
function priorityLabel(p) {
  return { high: 'Cao', medium: 'Trung Bình', low: 'Thấp' }[p] || p;
}

// ---- NAVIGATION ----
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const el = document.getElementById('view-' + view);
  if (el) el.classList.remove('hidden');
  const nav = document.getElementById('nav-' + view);
  if (nav) nav.classList.add('active');

  State.currentView = view;
  const titles = { dashboard: 'Dashboard', projects: 'Dự Án', kanban: 'Kanban Board', timeline: 'Timeline', tasks: 'Nhiệm Vụ' };
  document.getElementById('topbar-title').textContent = titles[view] || view;

  if (view === 'dashboard') renderDashboard();
  if (view === 'projects') renderProjects();
  if (view === 'kanban') renderKanban();
  if (view === 'timeline') renderTimeline();
  if (view === 'tasks') renderTasks();

  // close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// ---- DASHBOARD ----
function renderDashboard() {
  const totalProj = State.projects.length;
  const totalTasks = State.tasks.length;
  const inProg = State.tasks.filter(t => t.status === 'inprogress').length;
  const done = State.tasks.filter(t => t.status === 'done').length;

  document.getElementById('stat-total-projects').textContent = totalProj;
  document.getElementById('stat-total-tasks').textContent = totalTasks;
  document.getElementById('stat-in-progress').textContent = inProg;
  document.getElementById('stat-completed').textContent = done;

  renderRecentProjects();
  renderProgressChart();
  renderUpcomingDeadlines();
}

function renderRecentProjects() {
  const el = document.getElementById('recent-projects-list');
  const recent = [...State.projects].slice(-5).reverse();
  if (!recent.length) {
    el.innerHTML = '<div class="empty-state-small">Chưa có dự án nào. Hãy tạo dự án đầu tiên!</div>';
    return;
  }
  el.innerHTML = recent.map(p => {
    const pct = getProjectProgress(p.id);
    const count = getProjectTaskCount(p.id);
    return `<div class="project-list-item">
      <div class="proj-color-dot" style="background:${escHtml(p.color)}"></div>
      <div class="proj-info">
        <div class="proj-info-name">${escHtml(p.name)}</div>
        <div class="proj-info-sub">${count} nhiệm vụ</div>
      </div>
      <div class="proj-bar">
        <div class="mini-progress"><div class="mini-progress-fill" style="width:${pct}%;background:${escHtml(p.color)}"></div></div>
        <div class="mini-pct">${pct}%</div>
      </div>
    </div>`;
  }).join('');
}

function renderProgressChart() {
  const canvas = document.getElementById('progress-chart');
  const ctx = canvas.getContext('2d');
  const todo = State.tasks.filter(t => t.status === 'todo').length;
  const inprog = State.tasks.filter(t => t.status === 'inprogress' || t.status === 'review').length;
  const done = State.tasks.filter(t => t.status === 'done').length;
  const total = todo + inprog + done;
  const pct = total ? Math.round(done / total * 100) : 0;

  document.getElementById('chart-percent').textContent = pct + '%';

  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2, r = 75, innerR = 52;
  const TWO_PI = Math.PI * 2;

  const data = [
    { value: inprog || (total ? 0 : 1), color: '#1992b0' },
    { value: todo, color: '#ff9500' },
    { value: done, color: '#22c55e' },
  ];
  const totalVal = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2;

  data.forEach(seg => {
    const slice = (seg.value / totalVal) * TWO_PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    angle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, TWO_PI);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#161b22';
  ctx.fill();
}

function renderUpcomingDeadlines() {
  const el = document.getElementById('upcoming-deadlines-list');
  const now = new Date(); now.setHours(0,0,0,0);
  const tasks = State.tasks
    .filter(t => t.deadline && t.status !== 'done')
    .map(t => ({ ...t, days: daysLeft(t.deadline) }))
    .filter(t => t.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  if (!tasks.length) {
    el.innerHTML = '<div class="empty-state-small">Không có deadline sắp tới.</div>';
    return;
  }

  el.innerHTML = tasks.map(t => {
    const proj = State.projects.find(p => p.id === t.projectId);
    const cls = t.days < 0 ? 'urgent' : t.days <= 3 ? 'warning' : '';
    const badgeCls = t.days < 0 ? 'urgent' : t.days <= 3 ? 'warning' : 'ok';
    const daysText = t.days < 0 ? `Quá hạn ${-t.days} ngày` : t.days === 0 ? 'Hôm nay!' : `Còn ${t.days} ngày`;
    return `<div class="upcoming-item ${cls}">
      <div class="upcoming-item-name">${escHtml(t.name)}</div>
      <div class="upcoming-deadline-info">${proj ? escHtml(proj.name) : ''}</div>
      <div class="deadline-badge ${badgeCls}">${daysText}</div>
    </div>`;
  }).join('');
}

// ---- PROJECTS ----
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  const addCard = `<div class="project-card-add" id="btn-add-project">
    <div class="add-icon">+</div>
    <div>Tạo Dự Án Mới</div>
  </div>`;

  if (!State.projects.length) {
    grid.innerHTML = addCard;
    document.getElementById('btn-add-project')?.addEventListener('click', openAddProject);
    return;
  }

  grid.innerHTML = addCard + State.projects.map(p => {
    const pct = getProjectProgress(p.id);
    const count = getProjectTaskCount(p.id);
    return `<div class="project-card" style="--proj-color:${escHtml(p.color)}" data-proj-id="${p.id}">
      <div class="project-card-header">
        <div class="project-card-icon" style="background:${escHtml(p.color)}22">
          📁
        </div>
        <div class="project-card-actions">
          <button class="btn-icon btn-edit-proj" data-id="${p.id}" title="Chỉnh sửa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon btn-delete-proj" data-id="${p.id}" title="Xóa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      </div>
      <div class="project-card-name">${escHtml(p.name)}</div>
      <div class="project-card-desc">${escHtml(p.description || 'Không có mô tả.')}</div>
      <div class="project-progress-label"><span>Tiến Độ</span><span>${pct}%</span></div>
      <div class="project-progress-bar"><div class="project-progress-fill" style="width:${pct}%"></div></div>
      <div class="project-card-footer">
        <div class="project-task-count">${count} nhiệm vụ</div>
        <div class="project-deadline">${p.endDate ? '📅 ' + formatDate(p.endDate) : ''}</div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.btn-edit-proj').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEditProject(btn.dataset.id); });
  });
  grid.querySelectorAll('.btn-delete-proj').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteProject(btn.dataset.id); });
  });
  grid.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.dataset.projId;
      State.kanbanProjectId = pid;
      switchView('kanban');
    });
  });
  document.getElementById('btn-add-project')?.addEventListener('click', openAddProject);
}

// ---- PROJECT MODAL ----
let selectedColor = '#1992b0';

function openAddProject() {
  selectedColor = '#1992b0';
  document.getElementById('proj-name').value = '';
  document.getElementById('proj-desc').value = '';
  document.getElementById('proj-start').value = '';
  document.getElementById('proj-end').value = '';
  document.getElementById('proj-editing-id').value = '';
  document.getElementById('modal-project-title').textContent = 'Tạo Dự Án Mới';
  document.querySelectorAll('.color-opt').forEach(o => o.classList.toggle('selected', o.dataset.color === selectedColor));
  document.getElementById('modal-project').classList.remove('hidden');
  document.getElementById('proj-name').focus();
}

function openEditProject(id) {
  const p = State.projects.find(x => x.id === id);
  if (!p) return;
  selectedColor = p.color || '#1992b0';
  document.getElementById('proj-name').value = p.name;
  document.getElementById('proj-desc').value = p.description || '';
  document.getElementById('proj-start').value = p.startDate || '';
  document.getElementById('proj-end').value = p.endDate || '';
  document.getElementById('proj-editing-id').value = id;
  document.getElementById('modal-project-title').textContent = 'Chỉnh Sửa Dự Án';
  document.querySelectorAll('.color-opt').forEach(o => o.classList.toggle('selected', o.dataset.color === selectedColor));
  document.getElementById('modal-project').classList.remove('hidden');
}

function closeProjectModal() {
  document.getElementById('modal-project').classList.add('hidden');
}

function saveProject() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { showToast('Vui lòng nhập tên dự án!', 'error'); return; }
  const editId = document.getElementById('proj-editing-id').value;
  if (editId) {
    const idx = State.projects.findIndex(p => p.id === editId);
    if (idx !== -1) {
      State.projects[idx] = {
        ...State.projects[idx],
        name, description: document.getElementById('proj-desc').value.trim(),
        startDate: document.getElementById('proj-start').value,
        endDate: document.getElementById('proj-end').value,
        color: selectedColor,
        updatedAt: new Date().toISOString(),
      };
    }
    showToast('Đã cập nhật dự án!', 'success');
  } else {
    State.projects.push({
      id: uid(), name,
      description: document.getElementById('proj-desc').value.trim(),
      startDate: document.getElementById('proj-start').value,
      endDate: document.getElementById('proj-end').value,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    });
    showToast('Đã tạo dự án mới!', 'success');
  }
  saveData();
  closeProjectModal();
  if (State.currentView === 'projects') renderProjects();
  if (State.currentView === 'dashboard') renderDashboard();
}

function deleteProject(id) {
  if (!confirm('Bạn chắc chắn muốn xóa dự án này? Tất cả nhiệm vụ liên quan cũng sẽ bị xóa.')) return;
  State.projects = State.projects.filter(p => p.id !== id);
  State.tasks = State.tasks.filter(t => t.projectId !== id);
  saveData();
  renderProjects();
  showToast('Đã xóa dự án.', 'info');
}

// ---- TASK MODAL ----
function openAddTask(status = 'todo', projectId = '') {
  document.getElementById('task-name').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-status').value = status;
  document.getElementById('task-deadline').value = '';
  document.getElementById('task-progress').value = 0;
  document.getElementById('task-progress-label').textContent = '0%';
  document.getElementById('task-editing-id').value = '';
  document.getElementById('task-default-status').value = status;
  document.getElementById('modal-task-title').textContent = 'Thêm Nhiệm Vụ';
  populateTaskProjectSelect(projectId || State.kanbanProjectId || '');
  document.getElementById('modal-task').classList.remove('hidden');
  document.getElementById('task-name').focus();
}

function openEditTask(id) {
  const t = State.tasks.find(x => x.id === id);
  if (!t) return;
  document.getElementById('task-name').value = t.name;
  document.getElementById('task-desc').value = t.description || '';
  document.getElementById('task-priority').value = t.priority || 'medium';
  document.getElementById('task-status').value = t.status || 'todo';
  document.getElementById('task-deadline').value = t.deadline || '';
  document.getElementById('task-progress').value = t.progress || 0;
  document.getElementById('task-progress-label').textContent = (t.progress || 0) + '%';
  document.getElementById('task-editing-id').value = id;
  document.getElementById('modal-task-title').textContent = 'Chỉnh Sửa Nhiệm Vụ';
  populateTaskProjectSelect(t.projectId || '');
  document.getElementById('modal-task').classList.remove('hidden');
}

function closeTaskModal() {
  document.getElementById('modal-task').classList.add('hidden');
}

function populateTaskProjectSelect(selectedPid) {
  const sel = document.getElementById('task-project-id');
  sel.innerHTML = '<option value="">-- Không có dự án --</option>' +
    State.projects.map(p => `<option value="${p.id}"${p.id === selectedPid ? ' selected' : ''}>${escHtml(p.name)}</option>`).join('');
}

function saveTask() {
  const name = document.getElementById('task-name').value.trim();
  if (!name) { showToast('Vui lòng nhập tên nhiệm vụ!', 'error'); return; }
  const editId = document.getElementById('task-editing-id').value;
  const status = document.getElementById('task-status').value;
  const progress = status === 'done' ? 100 : parseInt(document.getElementById('task-progress').value) || 0;

  const taskData = {
    name,
    description: document.getElementById('task-desc').value.trim(),
    projectId: document.getElementById('task-project-id').value,
    priority: document.getElementById('task-priority').value,
    status, deadline: document.getElementById('task-deadline').value,
    progress,
  };

  if (editId) {
    const idx = State.tasks.findIndex(t => t.id === editId);
    if (idx !== -1) State.tasks[idx] = { ...State.tasks[idx], ...taskData, updatedAt: new Date().toISOString() };
    showToast('Đã cập nhật nhiệm vụ!', 'success');
  } else {
    State.tasks.push({ id: uid(), ...taskData, createdAt: new Date().toISOString() });
    showToast('Đã thêm nhiệm vụ!', 'success');
  }
  saveData();
  closeTaskModal();
  if (State.currentView === 'kanban') renderKanban();
  if (State.currentView === 'tasks') renderTasks();
  if (State.currentView === 'dashboard') renderDashboard();
}

function deleteTask(id) {
  if (!confirm('Xóa nhiệm vụ này?')) return;
  State.tasks = State.tasks.filter(t => t.id !== id);
  saveData();
  if (State.currentView === 'kanban') renderKanban();
  if (State.currentView === 'tasks') renderTasks();
  if (State.currentView === 'dashboard') renderDashboard();
  showToast('Đã xóa nhiệm vụ.', 'info');
}

// ---- KANBAN ----
function renderKanban() {
  updateProjectSelects();
  const pid = State.kanbanProjectId;

  const kanbanSel = document.getElementById('kanban-project-select');
  kanbanSel.value = pid || '';

  const statuses = ['todo', 'inprogress', 'review', 'done'];
  statuses.forEach(status => {
    let tasks = State.tasks.filter(t => t.status === status);
    if (pid) tasks = tasks.filter(t => t.projectId === pid);
    document.getElementById('count-' + status).textContent = tasks.length;
    const col = document.getElementById('cards-' + status);
    col.innerHTML = '';
    tasks.forEach(t => col.appendChild(createKanbanCard(t)));
  });
  setupDragDrop();
}

function createKanbanCard(task) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  card.draggable = true;
  card.dataset.id = task.id;
  const dl = task.deadline ? daysLeft(task.deadline) : null;
  const dlClass = dl !== null && dl < 0 ? 'overdue' : '';
  const dlText = task.deadline ? (dl !== null && dl < 0 ? `Quá hạn ${-dl}n` : `${formatDate(task.deadline)}`) : '';
  const proj = State.projects.find(p => p.id === task.projectId);
  card.innerHTML = `
    <div class="kanban-card-title">${escHtml(task.name)}</div>
    ${task.description ? `<div class="kanban-card-desc">${escHtml(task.description.slice(0, 80))}${task.description.length > 80 ? '...' : ''}</div>` : ''}
    ${(task.progress > 0) ? `<div class="card-progress-wrap"><div class="card-progress-bar"><div class="card-progress-fill" style="width:${task.progress}%"></div></div></div>` : ''}
    <div class="kanban-card-footer">
      <span class="priority-badge priority-${task.priority}">${priorityLabel(task.priority)}</span>
      ${task.deadline ? `<span class="card-deadline-small ${dlClass}">📅 ${dlText}</span>` : ''}
      <div class="kanban-card-actions">
        <button class="btn-icon btn-edit-task" data-id="${task.id}" title="Sửa">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon btn-delete-task" data-id="${task.id}" title="Xóa">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
    ${proj ? `<div style="margin-top:8px;font-size:0.72rem;color:var(--text-muted);">📁 ${escHtml(proj.name)}</div>` : ''}
  `;
  card.querySelector('.btn-edit-task')?.addEventListener('click', e => { e.stopPropagation(); openEditTask(task.id); });
  card.querySelector('.btn-delete-task')?.addEventListener('click', e => { e.stopPropagation(); deleteTask(task.id); });
  return card;
}

// ---- DRAG & DROP ----
function setupDragDrop() {
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      State.draggedTaskId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
    });
  });

  document.querySelectorAll('.kanban-cards').forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      col.closest('.kanban-col').classList.add('drag-over');
    });
    col.addEventListener('dragleave', e => {
      if (!col.contains(e.relatedTarget)) {
        col.closest('.kanban-col').classList.remove('drag-over');
      }
    });
    col.addEventListener('drop', e => {
      e.preventDefault();
      const newStatus = col.dataset.status;
      const taskIdx = State.tasks.findIndex(t => t.id === State.draggedTaskId);
      if (taskIdx !== -1 && State.tasks[taskIdx].status !== newStatus) {
        State.tasks[taskIdx].status = newStatus;
        if (newStatus === 'done') State.tasks[taskIdx].progress = 100;
        saveData();
        renderKanban();
        showToast(`Đã chuyển sang: ${statusLabel(newStatus)}`, 'success');
      }
      document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
    });
  });
}

// ---- TIMELINE ----
function renderTimeline() {
  updateProjectSelects();
  const pid = State.timelineProjectId;
  const timelineSel = document.getElementById('timeline-project-select');
  timelineSel.value = pid || '';
  const container = document.getElementById('timeline-container');

  if (!pid) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div>Chọn một dự án để xem timeline</div></div>';
    return;
  }

  const tasks = State.tasks.filter(t => t.projectId === pid && t.deadline);
  const proj = State.projects.find(p => p.id === pid);

  if (!tasks.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🗂️</div><div>Dự án này chưa có nhiệm vụ nào có deadline.</div></div>';
    return;
  }

  // Calculate date range
  const today = new Date(); today.setHours(0,0,0,0);
  const proj_start = proj?.startDate ? new Date(proj.startDate + 'T00:00:00') : today;
  const allDates = tasks.map(t => new Date(t.deadline + 'T00:00:00'));
  const minDate = new Date(Math.min(proj_start.getTime(), ...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 3);
  const totalDays = Math.max((maxDate - minDate) / 86400000, 14);

  // Generate day labels
  const dayHeaders = [];
  const labelStep = Math.ceil(totalDays / 10);
  for (let i = 0; i <= totalDays; i += labelStep) {
    const d = new Date(minDate.getTime() + i * 86400000);
    dayHeaders.push({ day: i, label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) });
  }

  const statusColors = { todo: '#ff9500', inprogress: '#1992b0', review: '#a855f7', done: '#22c55e' };
  const todayOffset = Math.max(0, Math.min(100, (today - minDate) / (totalDays * 86400000) * 100));

  container.innerHTML = `
    <div style="overflow-x:auto">
      <div style="min-width:600px">
        <div class="timeline-header" style="position:sticky;top:0;z-index:2;background:var(--bg);padding-left:200px">
          <div style="flex:1;position:relative;height:20px">
            ${dayHeaders.map(h => `<span style="position:absolute;left:${(h.day/totalDays*100).toFixed(1)}%;transform:translateX(-50%)">${h.label}</span>`).join('')}
          </div>
        </div>
        <div style="position:relative">
          ${tasks.map(t => {
            const endDate = new Date(t.deadline + 'T00:00:00');
            const startDate = t.createdAt ? new Date(t.createdAt) : new Date(Math.max(proj_start.getTime(), minDate.getTime()));
            startDate.setHours(0,0,0,0);
            const startPct = Math.max(0, (startDate - minDate) / (totalDays * 86400000) * 100);
            const endPct = Math.min(100, (endDate - minDate) / (totalDays * 86400000) * 100);
            const widthPct = Math.max(endPct - startPct, 2);
            const color = statusColors[t.status] || '#1992b0';
            return `<div class="timeline-row">
              <div class="timeline-task-name" title="${escHtml(t.name)}">${escHtml(t.name)}</div>
              <div class="timeline-bar-area">
                <div class="timeline-bar" style="left:${startPct.toFixed(1)}%;width:${widthPct.toFixed(1)}%;background:${color}">
                  ${t.progress || 0}%
                </div>
                ${dayHeaders.map(h => `<div class="timeline-grid-line" style="left:${(h.day/totalDays*100).toFixed(1)}%"></div>`).join('')}
              </div>
            </div>`;
          }).join('')}
          <!-- Today line -->
          <div class="timeline-today-line" style="left:calc(200px + ${todayOffset.toFixed(1)}% * (100% - 200px) / 100)"></div>
        </div>
      </div>
    </div>
  `;
}

// ---- TASKS TABLE ----
function renderTasks() {
  const search = document.getElementById('task-search').value.toLowerCase();
  const filterStatus = document.getElementById('task-filter-status').value;
  const filterPriority = document.getElementById('task-filter-priority').value;

  let tasks = [...State.tasks];
  if (search) tasks = tasks.filter(t => t.name.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));
  if (filterStatus) tasks = tasks.filter(t => t.status === filterStatus);
  if (filterPriority) tasks = tasks.filter(t => t.priority === filterPriority);

  const tbody = document.getElementById('tasks-tbody');
  if (!tasks.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Không tìm thấy nhiệm vụ nào.</td></tr>';
    return;
  }

  tbody.innerHTML = tasks.map(t => {
    const proj = State.projects.find(p => p.id === t.projectId);
    const dl = t.deadline ? daysLeft(t.deadline) : null;
    const dlStyle = dl !== null && dl < 0 && t.status !== 'done' ? 'color:var(--danger);font-weight:600' : '';
    return `<tr>
      <td>
        <div class="task-name-cell">${escHtml(t.name)}</div>
        ${t.description ? `<div class="task-desc-preview">${escHtml(t.description.slice(0,60))}${t.description.length>60?'...':''}</div>` : ''}
        ${t.progress > 0 ? `<div style="margin-top:6px;height:4px;width:120px;background:rgba(255,255,255,0.08);border-radius:10px"><div style="height:100%;width:${t.progress}%;background:var(--primary);border-radius:10px"></div></div>` : ''}
      </td>
      <td style="color:var(--text-secondary)">${proj ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${proj.color};margin-right:6px"></span>${escHtml(proj.name)}` : '—'}</td>
      <td><span class="priority-badge priority-${t.priority}">${priorityLabel(t.priority)}</span></td>
      <td><span class="status-badge status-${t.status}">${statusLabel(t.status)}</span></td>
      <td style="${dlStyle}">${t.deadline ? formatDate(t.deadline) : '—'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-icon btn-edit-task" data-id="${t.id}" title="Sửa">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon btn-delete-task" data-id="${t.id}" title="Xóa">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-edit-task').forEach(btn => btn.addEventListener('click', () => openEditTask(btn.dataset.id)));
  tbody.querySelectorAll('.btn-delete-task').forEach(btn => btn.addEventListener('click', () => deleteTask(btn.dataset.id)));
}

// ---- PROJECT SELECTS (kanban & timeline) ----
function updateProjectSelects() {
  const opts = '<option value="">-- Tất cả dự án --</option>' +
    State.projects.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
  document.getElementById('kanban-project-select').innerHTML = opts;
  document.getElementById('timeline-project-select').innerHTML = '<option value="">-- Chọn dự án --</option>' +
    State.projects.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
}

// ---- SAMPLE DATA ----
function loadSampleData() {
  if (State.projects.length) return;
  const p1 = uid(), p2 = uid();
  State.projects = [
    { id: p1, name: 'Redesign Website', description: 'Thiết kế lại toàn bộ giao diện website công ty theo phong cách hiện đại.', color: '#1992b0', startDate: '2026-03-01', endDate: '2026-04-30', createdAt: new Date().toISOString() },
    { id: p2, name: 'Ứng Dụng Mobile', description: 'Phát triển ứng dụng di động iOS & Android cho khách hàng.', color: '#ff9500', startDate: '2026-03-15', endDate: '2026-06-30', createdAt: new Date().toISOString() },
  ];
  State.tasks = [
    { id: uid(), name: 'Nghiên cứu đối thủ cạnh tranh', description: 'Phân tích top 5 đối thủ về UX/UI', projectId: p1, priority: 'high', status: 'done', deadline: '2026-03-20', progress: 100, createdAt: '2026-03-01T00:00:00.000Z' },
    { id: uid(), name: 'Thiết kế wireframe', description: 'Tạo wireframe cho trang chủ, trang sản phẩm và trang liên hệ', projectId: p1, priority: 'high', status: 'done', deadline: '2026-03-30', progress: 100, createdAt: '2026-03-05T00:00:00.000Z' },
    { id: uid(), name: 'Phát triển UI Components', description: 'Code các component cơ bản theo design system', projectId: p1, priority: 'medium', status: 'inprogress', deadline: '2026-04-20', progress: 60, createdAt: '2026-04-01T00:00:00.000Z' },
    { id: uid(), name: 'Tích hợp CMS', description: 'Kết nối với hệ thống quản lý nội dung', projectId: p1, priority: 'medium', status: 'todo', deadline: '2026-04-25', progress: 0, createdAt: '2026-04-01T00:00:00.000Z' },
    { id: uid(), name: 'Kiểm thử & QA', description: 'Test cross-browser và responsive design', projectId: p1, priority: 'high', status: 'todo', deadline: '2026-04-28', progress: 0, createdAt: '2026-04-01T00:00:00.000Z' },
    { id: uid(), name: 'Thiết kế UI App Mobile', description: 'Figma prototype cho iOS và Android', projectId: p2, priority: 'high', status: 'inprogress', deadline: '2026-04-15', progress: 75, createdAt: '2026-03-15T00:00:00.000Z' },
    { id: uid(), name: 'Phát triển Backend API', description: 'REST API với Node.js và PostgreSQL', projectId: p2, priority: 'high', status: 'review', deadline: '2026-05-01', progress: 90, createdAt: '2026-03-15T00:00:00.000Z' },
    { id: uid(), name: 'Tích hợp Push Notification', projectId: p2, priority: 'low', status: 'todo', deadline: '2026-05-20', progress: 0, createdAt: '2026-03-20T00:00:00.000Z' },
    { id: uid(), name: 'Beta Testing', description: 'Phát hành bản beta cho 50 người dùng thử nghiệm', projectId: p2, priority: 'medium', status: 'todo', deadline: '2026-06-10', progress: 0, createdAt: '2026-03-20T00:00:00.000Z' },
  ];
  saveData();
}

// ---- EVENT LISTENERS ----
function initEvents() {
  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); switchView(item.dataset.view); });
  });

  // Link buttons (dashboard → projects)
  document.querySelectorAll('.link-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Top bar add button
  document.getElementById('btn-add-main').addEventListener('click', () => {
    if (State.currentView === 'projects') openAddProject();
    else if (State.currentView === 'kanban' || State.currentView === 'tasks') openAddTask();
    else if (State.currentView === 'dashboard') openAddProject();
    else openAddTask();
  });

  // Mobile menu
  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Project modal
  document.getElementById('modal-project-close').addEventListener('click', closeProjectModal);
  document.getElementById('modal-project-cancel').addEventListener('click', closeProjectModal);
  document.getElementById('modal-project-save').addEventListener('click', saveProject);
  document.getElementById('modal-project').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-project')) closeProjectModal();
  });

  // Color picker
  document.getElementById('proj-color-picker').addEventListener('click', e => {
    const opt = e.target.closest('.color-opt');
    if (opt) {
      selectedColor = opt.dataset.color;
      document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    }
  });

  // Task modal
  document.getElementById('modal-task-close').addEventListener('click', closeTaskModal);
  document.getElementById('modal-task-cancel').addEventListener('click', closeTaskModal);
  document.getElementById('modal-task-save').addEventListener('click', saveTask);
  document.getElementById('modal-task').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-task')) closeTaskModal();
  });

  // Progress slider
  document.getElementById('task-progress').addEventListener('input', function() {
    document.getElementById('task-progress-label').textContent = this.value + '%';
  });

  // Kanban add cards
  document.querySelectorAll('.btn-add-card').forEach(btn => {
    btn.addEventListener('click', () => openAddTask(btn.dataset.status));
  });

  // Kanban project select
  document.getElementById('kanban-project-select').addEventListener('change', function() {
    State.kanbanProjectId = this.value || null;
    renderKanban();
  });

  // Timeline project select
  document.getElementById('timeline-project-select').addEventListener('change', function() {
    State.timelineProjectId = this.value || null;
    renderTimeline();
  });

  // Task filters
  document.getElementById('task-search').addEventListener('input', renderTasks);
  document.getElementById('task-filter-status').addEventListener('change', renderTasks);
  document.getElementById('task-filter-priority').addEventListener('change', renderTasks);

  // Keyboard: close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeTaskModal();
    }
  });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadSampleData();
  initEvents();
  switchView('dashboard');
});
