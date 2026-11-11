'use strict';

// Use the same timetable and route checks as a regular shift.
function tutorialAction(station, defineRoute, type) {
  for (const [id, held] of Object.entries(station.handles)) {
    if (!held || station.route(id)?.green) continue;
    const [side, dir, platform] = id.split('-');
    return { kind: 'restore', route: defineRoute(side, dir, +platform) };
  }

  const trains = station.trains.filter(train => !train.gone)
    .sort((a, b) => Number(!!b.paid) - Number(!!a.paid) || a.dep - b.dep);

  for (const train of trains) {
    const platform = Number(train.loc.slice(1));
    const atPlatform = train.loc.startsWith('P');
    if (type === 'boundary' && atPlatform && train.arrived && !train.handover && station.time >= train.crewReadyAt) {
      return { kind: 'handover', train };
    }

    let route;
    if (type === 'terminal' && train.loc === 'HP' && train.shuntPhase === 'pocket') {
      route = defineRoute('H', 'in', 2);
    } else if (type === 'terminal' && atPlatform && train.needsPocket && train.shuntPhase === 'need-pocket') {
      if (train.reverseUntil - station.time <= 12) route = defineRoute('H', 'out', platform);
    } else if (train.loc === train.from + 'I') {
      route = defineRoute(train.from, 'in', train.p);
    } else if (atPlatform && train.readyAt - station.time <= 12) {
      route = defineRoute(train.to, 'out', platform);
    }
    if (!route || route.valid === false || station.route(route.id)) continue;
    const reason = station.check(route);
    if (!reason) return { kind: 'signal', route, train };
    if (!reason.startsWith('転てつ位置未照査')) continue;
    const wrong = Object.entries(route.req).find(([id, value]) =>
      station.points[id].value !== value && !station.points[id].moving && !station.pointLocks(id).length);
    if (wrong) return { kind: 'point', id: wrong[0], value: wrong[1], route, train };
  }
  return { kind: station.finished ? 'finish' : 'wait' };
}

if (typeof module !== 'undefined') module.exports = tutorialAction;
