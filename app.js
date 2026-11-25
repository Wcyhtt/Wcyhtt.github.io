'use strict';

function forwardKinematics(q1, q2, l1 = 1, l2 = 0.8) {
  const a = q1 * Math.PI / 180, b = (q1 + q2) * Math.PI / 180;
  return { elbow: { x: l1 * Math.cos(a), y: l1 * Math.sin(a) }, end: { x: l1 * Math.cos(a) + l2 * Math.cos(b), y: l1 * Math.sin(a) + l2 * Math.sin(b) } };
}

const experimentData = {
  structure: {
    rows: [['完整数据', 0.9306, ''], ['同步零散缺失 + 线性插值', 0.9304, 'muted'], ['连续缺失 + 线性插值', 0.6476, 'accent']],
    description: '固定同一个基线模型。零散缺失经线性插值后接近完整基线，连续中断仍明显退化。AUROC 越高，正常与故障的排序区分能力越好。'
  },
  training: {
    rows: [['正常续训', 0.6460, ''], ['零散缺失增强', 0.6448, 'muted'], ['连续缺失增强', 0.7575, 'accent']],
    description: '同一起点、相同预算，各续训 10 轮；均在连续缺失条件下评价。连续增强有改善，但完整数据召回也由 69.54% 降至 61.32%。'
  }
};

if (typeof document !== 'undefined') {
  const q1 = document.getElementById('q1'), q2 = document.getElementById('q2');
  const setXY = (id, p) => { const el = document.getElementById(id); el.setAttribute('cx', p.x); el.setAttribute('cy', p.y); };
  const screen = p => ({ x: 280 + 80 * p.x, y: 190 - 80 * p.y });
  function updateArm() {
    const a = Number(q1.value), b = Number(q2.value), model = forwardKinematics(a, b);
    const elbow = screen(model.elbow), end = screen(model.end);
    const path = `M280 190 L${elbow.x} ${elbow.y} L${end.x} ${end.y}`;
    document.getElementById('arm-path').setAttribute('d', path);
    document.getElementById('arm-shadow').setAttribute('d', path);
    document.getElementById('projection').setAttribute('d', `M${end.x} 190 V${end.y} H280`);
    setXY('elbow', elbow); setXY('end', end); setXY('end-glow', end);
    const label = document.getElementById('tool-label'); label.setAttribute('x', end.x + 15); label.setAttribute('y', end.y - 10);
    document.getElementById('q1-value').textContent = `${a}°`;
    document.getElementById('q2-value').textContent = `${b}°`;
    q1.setAttribute('aria-valuetext', `${a} 度`); q2.setAttribute('aria-valuetext', `${b} 度`);
    document.getElementById('coords').textContent = `x ${model.end.x.toFixed(3)}　y ${model.end.y.toFixed(3)}`;
  }
  q1.addEventListener('input', updateArm); q2.addEventListener('input', updateArm);
  document.getElementById('reset-arm').addEventListener('click', () => { q1.value = '35'; q2.value = '65'; updateArm(); });
  updateArm();

  const tabs = [...document.querySelectorAll('[data-mode]')];
  function showChart(mode) {
    const data = experimentData[mode], bars = document.getElementById('bars'); bars.replaceChildren();
    data.rows.forEach(([name, value, color]) => {
      const row = document.createElement('div'); row.className = 'bar-row';
      const label = document.createElement('div'); label.className = 'bar-label';
      const nameEl = document.createElement('span'); nameEl.textContent = name;
      const valueEl = document.createElement('b'); valueEl.textContent = value.toFixed(4);
      label.append(nameEl, valueEl);
      const track = document.createElement('div'); track.className = 'bar-track'; track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('div'); fill.className = `bar-fill ${color}`; fill.style.width = `${value * 100}%`;
      track.append(fill); row.append(label, track); bars.append(row);
    });
    document.getElementById('chart-description').textContent = data.description;
    tabs.forEach(t => { const active = t.dataset.mode === mode; t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; });
    document.getElementById('chart-content').setAttribute('aria-labelledby', `tab-${mode}`);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showChart(tab.dataset.mode));
    tab.addEventListener('keydown', e => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].focus(); showChart(tabs[next].dataset.mode);
      }
    });
  });
  showChart('structure');

  const dialog = document.getElementById('project-dialog');
  const detailsButton = document.getElementById('open-details');
  detailsButton.addEventListener('click', () => dialog.showModal());
  document.getElementById('close-details').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => detailsButton.focus());
}
if (typeof module !== 'undefined') module.exports = { forwardKinematics, experimentData };
