/* Browser gamepads: standard controllers and configurable USB retro pads. */
window.HandsPad = (() => {
  let api, active = null, previous = {}, held = {}, nextNav = 0, wizard = null, waiting = false;
  let profiles = {}; try { profiles = JSON.parse(localStorage.getItem('hands-pad-profiles') || '{}'); } catch {}
  const actions = ['jump', 'attack', 'run', 'pause'];
  const names = ['PULAR', 'ACORDE', 'CORRER', 'PAUSAR'];
  const down = (p, i) => !!p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > .55);
  function clear() { held = {}; if (api) api.input(held); }
  function label(text) { const el = document.getElementById('controllerStatus'); if (el) el.textContent = text; }
  function configure() {
    if (wizard) { wizard = null; clear(); label('Configuração cancelada. Seu mapeamento anterior foi mantido.'); return; }
    if (!active) { api.notice('Conecte o controle e pressione um botão para o navegador reconhecê-lo.'); return; }
    api.pause(); clear(); wizard = { step: 0, map: {} }; waiting = true;
    label('Solte os botões. Depois pressione o botão para PULAR. Toque em Configurar novamente para cancelar.');
  }
  function poll(t) {
    if (!api) return;
    let pads; try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : []; } catch { return; }
    const p = pads.find(p => p && p.connected && p.index === active?.index) || pads.find(p => p && p.connected);
    if (!p) {
      if (active) { active = null; wizard = null; previous = {}; clear(); api.pause(); label('Controle desconectado · conecte e pressione um botão.'); }
      return;
    }
    if (!active || p.id !== active.id || p.index !== active.index) {
      active = { id: p.id, index: p.index }; previous = {}; clear();
      label('Controle conectado · direcional move · botão inferior pula · Configurar para personalizar.');
    }
    if (document.hidden || (document.hasFocus && !document.hasFocus())) { clear(); previous = {}; return; }
    if (wizard) {
      const pressed = p.buttons.map((_, i) => i).filter(i => down(p, i));
      if (!pressed.length) waiting = false;
      if (pressed.length && !waiting) {
        wizard.map[actions[wizard.step++]] = pressed[0]; waiting = true;
        if (wizard.step === actions.length) {
          profiles[p.id] = wizard.map;
          try { localStorage.setItem('hands-pad-profiles', JSON.stringify(profiles)); } catch {}
          wizard = null; previous = { jump: true, attack: true, run: true, pause: true };
          label('Controle configurado! Use seu botão de pausa para continuar.');
        } else label('Solte e pressione o botão para ' + names[wizard.step] + '.');
      }
      return;
    }
    const standard = p.mapping === 'standard';
    const map = profiles[p.id] || { jump: 0, attack: standard ? 2 : 1, run: standard ? 1 : 2, pause: standard || p.buttons.length > 9 ? 9 : 7 };
    const x = p.axes[0] || 0, y = p.axes[1] || 0;
    const now = { left: x < -.35 || down(p, 14), right: x > .35 || down(p, 15), up: y < -.35 || down(p, 12), bottom: y > .35 || down(p, 13) };
    for (const action of actions) now[action] = down(p, map[action]);
    if (now.pause && !previous.pause) api.togglePause();
    if (api.playing()) {
      held = { left: now.left, right: now.right, run: now.run, attack: now.attack };
      api.input(held);
      if (now.jump && !previous.jump) api.jump();
      if (!now.jump && previous.jump) api.cutJump();
    } else {
      clear();
      const direction = now.right ? 1 : now.left ? -1 : now.bottom ? 1 : now.up ? -1 : 0;
      const wasDirection = previous.right || previous.left || previous.bottom || previous.up;
      if (direction && (!wasDirection || t > nextNav)) {
        const root = document.getElementById('panel').classList.contains('hidden') ? document.getElementById('titleScreen') : document.getElementById('panel');
        const buttons = Array.from(root.querySelectorAll('button:not(:disabled)')).filter(b => b.getClientRects().length);
        if (buttons.length) { const index = buttons.indexOf(document.activeElement); const b = buttons[(index + direction + buttons.length) % buttons.length]; b.focus(); b.scrollIntoView({block:'nearest'}); }
        nextNav = t + (wasDirection ? 160 : 360);
      }
      if (now.jump && !previous.jump && !now.pause) {
        const focused = document.activeElement;
        if (focused?.tagName === 'BUTTON' && focused.closest('#overlay')) focused.click();
        else document.getElementById('startBtn').click();
      }
    }
    previous = now;
  }
  return { poll, init(adapter) { api = adapter; document.getElementById('controllerConfig').onclick = configure; }, cancel() { wizard = null; clear(); } };
})();
