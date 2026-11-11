'use strict';

(() => {
  const namespace = 'http://www.w3.org/2000/svg';
  const panel = document.querySelector('.diagramwrap > svg');
  if (!panel) return;

  const backing = document.createElement('div');
  backing.hidden = true;
  document.body.append(backing);
  const visuals = new WeakMap();

  function element(tag, attributes, parent) {
    const node = document.createElementNS(namespace, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    parent.append(node);
    return node;
  }

  function gradient(defs, id, stops, radial = false) {
    const fill = element(radial ? 'radialGradient' : 'linearGradient',
      radial ? { id, cx: '32%', cy: '25%', r: '75%' } : { id }, defs);
    for (const [offset, color] of stops) element('stop', { offset, 'stop-color': color }, fill);
    return 'url(#' + id + ')';
  }

  const defs = element('defs', {}, panel);
  const metal = gradient(defs, 'control-metal', [['0%', '#e4ebdc'], ['52%', '#718e87'], ['100%', '#c8d7c6']]);
  const red = gradient(defs, 'control-red', [['0%', '#802f28'], ['60%', '#d65c4b'], ['100%', '#a9362c']]);
  const white = gradient(defs, 'control-white', [['0%', '#aebca9'], ['60%', '#edf1e1'], ['100%', '#c7d3c0']]);
  const green = gradient(defs, 'control-green', [['0%', '#235a43'], ['60%', '#6cb98b'], ['100%', '#398061']]);
  const pearl = gradient(defs, 'control-pearl', [['0%', '#fff'], ['42%', '#f1f5e9'], ['100%', '#a3b69f']], true);

  function label(parent, text, x, y, size, color) {
    const node = element('text', {
      x, y, fill: color, 'font-size': size, 'text-anchor': 'middle',
      'pointer-events': 'none', 'aria-hidden': 'true'
    }, parent);
    node.textContent = text;
    return node;
  }

  function replaceControl(fo) {
    const button = fo.querySelector('button');
    if (!button) return;
    const rotor = button.classList.contains('rotor');
    const x = rotor ? +fo.dataset.trackX : +fo.getAttribute('x') + 35;
    const y = rotor ? +fo.dataset.trackY : +fo.getAttribute('y') + 16;
    const group = element('g', {
      transform: 'translate(' + x + ' ' + y + ')',
      class: 'svg-panel-control',
      role: rotor ? 'checkbox' : 'button',
      tabindex: 0,
      'aria-label': button.getAttribute('aria-label')
    }, panel);
    if (rotor) group.dataset.lever = fo.dataset.lever;
    const title = element('title', {}, group);
    const hit = element('circle', {
      class: 'svg-control-hit', r: rotor ? 18 : 19,
      fill: 'transparent', stroke: 'none', 'pointer-events': 'all'
    }, group);

    let refreshAppearance;
    if (rotor) {
      const point = button.classList.contains('point');
      const shunt = button.classList.contains('shunt');
      const direction = button.classList.contains('left') ? -1 : 1;
      element('rect', { x: -12.5, y: -12.5, width: 25, height: 25, rx: 8, fill: metal }, group);
      const handle = element('g', {}, group);
      element('rect', { x: -8, y: -33, width: 16, height: 39, rx: 5, fill: point ? white : shunt ? green : red }, handle);
      element('ellipse', { cx: 0, cy: -2, rx: 11, ry: 10, fill: '#132f30',
        stroke: point ? '#d9e1cc' : shunt ? '#a7d3ab' : '#b84435', 'stroke-width': 3 }, handle);
      label(handle, button.querySelector('.disc')?.textContent.trim() || '', 0, 2, 11, '#eef1da');

      const caption = fo.querySelector('.rotor-label');
      const state = caption?.querySelector('em');
      const above = !!fo.querySelector('.label-above');
      const offset = Number(caption?.style.transform.match(/translateX\((-?\d+)px\)/)?.[1] || 0);
      const captionText = [...(caption?.childNodes || [])]
        .filter(node => node !== state && node.nodeName !== 'BR')
        .map(node => node.textContent).join('').trim();
      label(group, captionText, offset, above ? -51 : 29, 9, '#e1e8d1');
      const stateText = label(group, '', offset, above ? -40 : 40, 8, '#bdd1b3');
      const lockText = label(group, '', 0, 18, 8, '#ffe984');
      refreshAppearance = () => {
        lockText.textContent = button.classList.contains('moving') ? '転換中'
          : button.classList.contains('locked') ? '鎖錠' : '';
        const on = button.classList.contains('reverse');
        handle.setAttribute('transform', 'rotate(' + (on ? direction * 55 : 0) + ')');
        group.setAttribute('aria-checked', String(on));
        hit.setAttribute('stroke', button.classList.contains('suggested') ? '#eedf96' : 'none');
        stateText.textContent = state?.textContent || '';
      };
    } else {
      const disc = element('circle', { r: 15, fill: pearl, stroke: '#c9d7bf', 'stroke-width': 2 }, group);
      label(group, button.textContent.trim(), 0, 3.5, 10, '#183c31');
      label(group, fo.querySelector('.destination-label')?.textContent || '', 0, 29, 9, '#c8ded8');
      refreshAppearance = () => {
        const available = button.classList.contains('available');
        disc.setAttribute('stroke', available ? '#fff' : '#c9d7bf');
        hit.setAttribute('stroke', available ? '#a1e2d3' : 'none');
      };
    }

    const stateNode = fo.querySelector('em');
    let previous;
    function sync() {
      const state = stateNode?.textContent || '';
      const key = [button.className, button.disabled, button.title, state].join('|');
      if (key === previous) return;
      previous = key;
      group.setAttribute('aria-disabled', String(button.disabled));
      group.setAttribute('tabindex', button.disabled ? '-1' : '0');
      title.textContent = button.title || button.getAttribute('aria-label');
      refreshAppearance();
    }
    group.addEventListener('click', () => { if (!button.disabled) button.click(); });
    group.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat && !button.disabled) button.click();
    });

    visuals.set(button, group);
    const wrap = button.parentElement;
    backing.append(wrap);
    new MutationObserver(sync).observe(wrap, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'disabled', 'title']
    });
    fo.remove();
    sync();
  }

  for (const fo of panel.querySelectorAll('foreignObject')) replaceControl(fo);
  window.RailSvgControls = { visual: button => visuals.get(button) || button };
})();
