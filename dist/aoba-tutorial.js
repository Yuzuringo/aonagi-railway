'use strict';

(() => {
  const type = document.getElementById('minase-modal') ? 'minase'
    : document.getElementById('terminal-modal') ? 'terminal'
    : document.getElementById('boundary-modal') ? 'boundary' : 'aoba';
  const isAoba = type === 'aoba';
  const nx = type === 'terminal' || type === 'boundary';
  const engine = { aoba: window.Rail, minase: window.MinaseRail,
    terminal: window.TerminalRail, boundary: window.BoundaryRail }[type];
  const names = { aoba: '青葉駅', minase: '水瀬駅', terminal: '汐見中央駅', boundary: '新凪原駅' };
  const modeKey = Object.keys(engine.DIFFICULTIES || engine.MODES)[0];
  const modeLabel = (engine.DIFFICULTIES || engine.MODES)[modeKey].label;
  const get = id => document.getElementById(id);
  const modal = get(isAoba ? 'modal' : type + '-modal');
  const startId = isAoba ? 'start' : type + '-start';
  const newShift = get(isAoba ? 'newshift' : type + '-new');
  const pauseButton = get(isAoba ? 'pause' : type + '-pause');
  const speedInput = get(isAoba ? 'speed' : type + '-speed');
  const refresh = isAoba ? render : paint;
  const storageKey = 'aonagi-' + type + '-tutorial-seen';
  const intro = document.createElement('dialog');
  intro.className = 'aoba-tutorial-intro';
  intro.setAttribute('aria-labelledby', 'tutorial-title');
  intro.innerHTML = `<h2 id="tutorial-title">${names[type]}の操作を練習</h2>
    <p>「${modeLabel}」の5分勤務を、光る操作箇所と吹き出しに沿って練習できます。操作を案内している間は時計が止まります。</p>
    <div class="tutorial-actions"><button id="tutorial-skip">閉じる</button>
    <button id="tutorial-start" class="primary" autofocus>練習を始める</button></div>`;
  document.body.append(intro);

  const guide = document.createElement('aside');
  guide.className = 'aoba-tutorial-guide';
  guide.setAttribute('aria-label', '操作チュートリアル');
  guide.hidden = true;
  guide.innerHTML = `<div role="status" aria-live="polite"><small id="tutorial-progress"></small>
    <h2 id="tutorial-heading"></h2><p id="tutorial-copy"></p></div>
    <button id="tutorial-exit">練習を終了</button>`;
  const ring = document.createElement('div');
  ring.className = 'aoba-tutorial-ring';
  ring.hidden = true;
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(guide, ring);

  const replay = document.createElement('button');
  replay.type = 'button';
  replay.textContent = '操作ガイド';
  newShift.before(replay);

  let saved;
  let timer;
  let target;
  let instructionKey;
  const lever = id => document.querySelector('.track-control[data-lever="' + id + '"] button');
  const pendingId = () => (type === 'terminal' ? pendingOrigin : pending)?.id;
  const remember = () => { try { localStorage.setItem(storageKey, '1'); } catch {} };

  function routeLever(route) {
    const side = route.side || route.gate;
    if (type === 'terminal') return originsForRoute(route)[0]?.id;
    if (type === 'boundary') {
      if (route.dir === 'in') return 'origin-' + side;
      if (route.p === 2) return 'origin-M' + side;
      return side === 'E' ? 'origin-1E' : 'origin-4W';
    }
    if (route.dir === 'in' && (isAoba || side === 'E')) return side + '-in';
    return route.id;
  }

  function instruction(action) {
    const { kind, route, train } = action;
    const trainLabel = train ? train.id + '列車。' : '';
    if (kind === 'point') {
      const label = lever(action.id)?.getAttribute('aria-label') || action.id;
      const position = action.value ? '反位R' : '定位N';
      const safety = type === 'minase' && Number(action.id) >= 31 ? ' 安全側線の分岐です。' : '';
      return [lever(action.id), '分岐を合わせる', trainLabel + label + 'を' + position + 'へ。' + safety];
    }
    if (kind === 'handover') {
      return [get('boundary-handover'), '乗務員引継を確認', trainLabel + '到着後の引継を確認すると、出発の準備が進みます。'];
    }
    if (kind === 'finish') {
      return [null, '練習完了', '5分勤務の全列車を扱いました。勤務画面に戻って通常の運転を始められます。'];
    }
    if (kind === 'wait') {
      return [null, '次の操作を待つ', '転換・列車の移動・出発準備を待っています。白い窓は進路構成、赤い窓は列車の在線です。'];
    }

    const id = routeLever(route);
    const signal = lever(id);
    const label = signal?.getAttribute('aria-label') || '';
    if (kind === 'restore') {
      return [signal, 'テコを定位に戻す', label + 'を押して定位Nへ復位します。列車の後尾が通過すると、残る鎖錠が解除されます。'];
    }
    const title = route.gate === 'H' ? '引上線の入換進路を設定' : route.dir === 'in' ? '場内進路を設定' : '出発進路を設定';
    if (!nx) {
      return [signal, title, trainLabel + label + 'を倒して進路を開通させます。'];
    }
    if (pendingId() !== id) {
      return [signal, title, trainLabel + label + 'を倒して発点にします。'];
    }
    const key = route.dir === 'in' ? 'P' + route.p : route.gate || route.side;
    const destination = type === 'terminal'
      ? destinationViews.find(view => view.key === key)?.b
      : destinations.find(view => view.key === key)?.button;
    return [destination, '着点ボタンを押す', trainLabel + (destination?.getAttribute('aria-label') || '') + 'を押すと進路が開通します。'];
  }

  function placeGuide() {
    if (!saved) return;
    ring.hidden = !target;
    guide.style.removeProperty('--guide-left');
    guide.style.removeProperty('--guide-top');
    if (!target) return;
    const rect = (target.querySelector('.base') || target).getBoundingClientRect();
    Object.assign(ring.style, {
      left: rect.left - 7 + 'px', top: rect.top - 7 + 'px',
      width: rect.width + 14 + 'px', height: rect.height + 14 + 'px'
    });
    if (innerWidth < 680) return;
    const left = Math.max(12, Math.min(innerWidth - guide.offsetWidth - 12, rect.left + rect.width / 2 - guide.offsetWidth / 2));
    const top = rect.bottom + guide.offsetHeight + 24 < innerHeight
      ? rect.bottom + 16 : Math.max(12, rect.top - guide.offsetHeight - 16);
    guide.style.setProperty('--guide-left', left + 'px');
    guide.style.setProperty('--guide-top', top + 'px');
  }

  function update() {
    const action = tutorialAction(station, engine.routeDef, type);
    const [button, heading, copy] = instruction(action);
    paused = action.kind !== 'wait';
    if (action.train && selected !== action.train.id) {
      selected = action.train.id;
      refresh();
    }
    const completed = station.plan.filter(row => station.records[row.id].dep != null).length;
    const progress = '5分勤務 · 出発 ' + completed + ' / ' + station.plan.length;
    const progressLabel = get('tutorial-progress');
    if (progressLabel.textContent !== progress) progressLabel.textContent = progress;
    const key = heading + copy;
    if (instructionKey !== key || target !== button) {
      instructionKey = key;
      target = button;
      get('tutorial-heading').textContent = heading;
      get('tutorial-copy').textContent = copy;
      get('tutorial-exit').textContent = action.kind === 'finish' ? '勤務画面に戻る' : '練習を終了';
      if (target) {
        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.focus({ preventScroll: true });
      }
      refresh();
    }
    placeGuide();
  }

  function startPractice() {
    remember();
    intro.close();
    saved = { station, paused, speed, selected, modalDisplay: modal.style.display };
    if (isAoba) { saved.report = seenResult; seenResult = true; }
    else if (type === 'terminal') {
      Object.assign(saved, { report: resultShown, pending: pendingOrigin, lastCandidate, chosenPlatform });
      resultShown = true;
      pendingOrigin = lastCandidate = chosenPlatform = null;
    } else {
      saved.report = shown;
      shown = true;
      if (type === 'boundary') { saved.pending = pending; pending = null; }
    }
    station = new engine.Station(5, modeKey).begin();
    selected = null;
    speed = 10;
    modal.style.display = 'none';
    speedInput.disabled = true;
    guide.hidden = false;
    instructionKey = null;
    update();
    timer = setInterval(update, 100);
  }

  function stopPractice() {
    if (!saved) return;
    clearInterval(timer);
    ({ station, paused, speed, selected } = saved);
    if (isAoba) seenResult = saved.report;
    else if (type === 'terminal') {
      resultShown = saved.report;
      pendingOrigin = saved.pending;
      ({ lastCandidate, chosenPlatform } = saved);
    } else {
      shown = saved.report;
      if (type === 'boundary') pending = saved.pending;
    }
    modal.style.display = saved.modalDisplay;
    saved = target = null;
    guide.hidden = ring.hidden = true;
    speedInput.disabled = false;
    refresh();
    if (modal.getClientRects().length) get('tutorial-menu')?.focus();
    else replay.focus();
  }

  document.addEventListener('click', event => {
    if (!saved) return;
    const control = event.target.closest('button');
    if (!control || control === target) return;
    if (control === newShift || control === pauseButton ||
        control.matches('.rotor, .destination, #boundary-handover')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('resize', placeGuide);
  window.addEventListener('scroll', placeGuide, true);
  get('tutorial-start').onclick = startPractice;
  get('tutorial-skip').onclick = () => { remember(); intro.close(); };
  get('tutorial-exit').onclick = stopPractice;
  intro.addEventListener('cancel', remember);

  function openGuide() {
    if (!saved && !intro.open) intro.showModal();
  }

  function addLobbyGuide() {
    const start = get(startId);
    if (!start || get('tutorial-menu')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'tutorial-menu';
    button.textContent = 'チュートリアルを始める';
    button.onclick = openGuide;
    start.before(button);
  }

  replay.onclick = openGuide;
  addLobbyGuide();
  new MutationObserver(addLobbyGuide).observe(modal, { childList: true, subtree: true });
  const preview = new URLSearchParams(location.search).get('tutorial') === 'preview';
  try {
    if (preview || !localStorage.getItem(storageKey)) openGuide();
  } catch { openGuide(); }
})();
