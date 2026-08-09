/* Long Road — Residence. Plan / 3D / data browser.
   Geometry is in inches, y increases downward (as in the survey sheets). */
(function () {
'use strict';

var S = { level: 1, view: 'plan', unit: 'ft', lang: 'en', dims: 'all', sel: null,
          yaw: -0.62, pitch: 0.95, zoom: 1, pan: {x:0, y:0} };

var T = {
  en: { plan:'PLAN', v3d:'3D', data:'DATA', l1:'LEVEL 1', l2:'LEVEL 2',
        dAll:'ALL SIZES', dSel:'SELECTED', dOff:'NO SIZES',
        pick:'Click any room — sizes stay on the drawing',
        drag:'Drag to orbit · wheel to zoom · click a room',
        area:'Area', perim:'Perimeter', vol:'Volume', clg:'Ceiling',
        walls:'Walls', doors:'Doors', wins:'Windows', src:'Source', wallrun:'Wall run, in order',
        photos:'Photos', scanned:'scanned', approx:'outline only', owner:'owner figure',
        nosel:'Pick a room on the drawing.',
        room:'Room', lvl:'Level', still:'Still missing',
        legend:'solid black wall = scanned · amber dashed = outline only, no scan table · red dashed = owner figure' },
  ru: { plan:'ПЛАН', v3d:'3D', data:'ДАННЫЕ', l1:'ЭТАЖ 1', l2:'ЭТАЖ 2',
        dAll:'ВСЕ РАЗМЕРЫ', dSel:'ВЫБРАННОЕ', dOff:'БЕЗ РАЗМЕРОВ',
        pick:'Нажмите на комнату — размеры остаются на чертеже',
        drag:'Тяните — поворот · колесо — масштаб · клик по комнате',
        area:'Площадь', perim:'Периметр', vol:'Объём', clg:'Потолок',
        walls:'Стены', doors:'Двери', wins:'Окна', src:'Источник', wallrun:'Стены по порядку',
        photos:'Фото', scanned:'скан', approx:'только контур', owner:'со слов владельца',
        nosel:'Выберите комнату на чертеже.',
        room:'Помещение', lvl:'Этаж', still:'Чего ещё нет',
        legend:'сплошная чёрная стена = скан · янтарный пунктир = только контур, без таблицы скана · красный пунктир = со слов владельца' }
};
function t(k){ return T[S.lang][k]; }

/* ---------- units ---------- */
function ftin(inch) {
  var f = Math.floor(inch / 12), r = inch - f * 12;
  r = Math.round(r * 100) / 100;
  if (r >= 12) { f += 1; r -= 12; }
  return f + "' " + (r % 1 === 0 ? r : r.toFixed(2)) + '"';
}
function metres(inch){ return (inch * 0.0254).toFixed(2) + ' m'; }
function len(inch){ return S.unit === 'ft' ? ftin(inch) : metres(inch); }
function len2(inch){ return S.unit === 'ft' ? metres(inch) : ftin(inch); }
function areaS(sf){ return S.unit === 'ft' ? sf.toFixed(2) + ' ft²' : (sf * 0.092903).toFixed(2) + ' m²'; }
function areaS2(sf){ return S.unit === 'ft' ? (sf * 0.092903).toFixed(2) + ' m²' : sf.toFixed(2) + ' ft²'; }
/* a room whose width was never measured has no area — the outline is a drawing, not a figure */
function roomArea(r){ return r.noArea ? (S.lang === 'ru' ? 'ширина не замерена' : 'width never measured') : areaS(r.sf); }
function roomArea2(r){ return r.noArea ? (S.lang === 'ru' ? 'площади нет' : 'no area') : areaS2(r.sf); }
function volS(v){ return v == null ? null : (S.unit === 'ft' ? v.toFixed(2) + ' ft³' : (v * 0.0283168).toFixed(2) + ' m³'); }

/* ---------- geometry helpers ---------- */
function rooms(){ return window.ROOMS.filter(function (r) { return r.level === S.level; }); }
function bbox(list) {
  var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  list.forEach(function (r) { r.poly.forEach(function (p) {
    b.x0 = Math.min(b.x0, p[0]); b.y0 = Math.min(b.y0, p[1]);
    b.x1 = Math.max(b.x1, p[0]); b.y1 = Math.max(b.y1, p[1]); }); });
  return b;
}
function centroid(poly) {
  var a = 0, cx = 0, cy = 0;
  for (var i = 0; i < poly.length; i++) {
    var p = poly[i], q = poly[(i + 1) % poly.length], f = p[0] * q[1] - q[0] * p[1];
    a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f;
  }
  a *= 0.5; if (Math.abs(a) < 1e-9) return [poly[0][0], poly[0][1]];
  return [cx / (6 * a), cy / (6 * a)];
}
function inside(poly, x, y) {
  var c = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
/* the point furthest from any wall — the only safe place to hang a label inside a room */
function inscribed(poly) {
  var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  poly.forEach(function (p) { b.x0 = Math.min(b.x0, p[0]); b.y0 = Math.min(b.y0, p[1]);
                              b.x1 = Math.max(b.x1, p[0]); b.y1 = Math.max(b.y1, p[1]); });
  var best = centroid(poly), bd = -1, N = 26;
  for (var i = 1; i < N; i++) for (var j = 1; j < N; j++) {
    var x = b.x0 + (b.x1 - b.x0) * i / N, y = b.y0 + (b.y1 - b.y0) * j / N;
    if (!inside(poly, x, y)) continue;
    var d = 1e9;
    for (var k = 0; k < poly.length; k++) {
      var p = poly[k], q = poly[(k + 1) % poly.length];
      d = Math.min(d, distSeg(x, y, p[0], p[1], q[0], q[1]));
    }
    if (d > bd) { bd = d; best = [x, y]; }
  }
  return { pt: best, r: Math.max(bd, 0) };
}
function anchor(poly) { return inscribed(poly).pt; }
function distSeg(px, py, x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
  var u = L ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L)) : 0;
  var qx = x1 + u * dx, qy = y1 + u * dy;
  return Math.hypot(px - qx, py - qy);
}
function el(tag, attrs, text) {
  var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}
function confClass(c){ return c === 'scanned' ? 'sc' : (c === 'owner' ? 'ow' : 'ap'); }
function nameOf(r){ return S.lang === 'ru' ? r.ru : r.en; }

/* ---------- 2D plan ---------- */
function drawPlan() {
  var svg = document.getElementById('svg-plan');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  var list = rooms(), b = bbox(list);
  var span = Math.max(b.x1 - b.x0, b.y1 - b.y0);
  var F = span / 44;            /* base type size — big on purpose */

  /* rooms too narrow to hold their own label get one outside, on a leader */
  var out = [];
  list.forEach(function (r) {
    var ins = inscribed(r.poly);
    r._a = ins.pt;
    /* out if the room cannot host its label at a readable size, or is simply too thin */
    r._out = roomScale(r, F) < F * 0.72 || ins.r < F * 1.1;
    if (r._out) out.push(r);
  });
  var colW = F * 10, gap = F * 2.6;
  var left = [], right = [];
  out.sort(function (x, y) { return x._a[1] - y._a[1]; });
  out.forEach(function (r) { ((r._a[0] < (b.x0 + b.x1) / 2) ? left : right).push(r); });
  [left, right].forEach(function (col, ci) {
    var last = -1e9;
    col.forEach(function (r) {
      var y = Math.max(r._a[1], last + gap * 1.32);
      last = y;
      r._lx = ci === 0 ? b.x0 - F * 2.8 - colW : b.x1 + F * 2.8;
      r._ly = y;
      r._side = ci;
    });
  });
  var padL = left.length ? F * 13.5 : span * 0.085 + 26;
  var padR = right.length ? F * 13.5 : span * 0.085 + 26;
  var padT = span * 0.085 + 26, padB = span * 0.06 + 20;
  var y0 = b.y0 - padT, y1 = b.y1 + padB;
  out.forEach(function (r) { y0 = Math.min(y0, r._ly - F * 1.6); y1 = Math.max(y1, r._ly + F * 2.4); });
  svg.setAttribute('viewBox', (b.x0 - padL) + ' ' + y0 + ' ' +
    (b.x1 - b.x0 + padL + padR) + ' ' + (y1 - y0));

  var gRoom = el('g'), gTxt = el('g'), gDim = el('g');

  list.forEach(function (r) {
    var pts = r.poly.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var poly = el('polygon', { points: pts, 'class': 'room ' + confClass(r.conf) +
      (r.conf !== 'scanned' ? ' approx' : '') + (S.sel === r.id ? ' on' : ''),
      'data-id': r.id, tabindex: 0 });
    poly.addEventListener('click', function () { select(r.id); });
    poly.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.id); } });
    gRoom.appendChild(poly);

    var a = r._a;
    if (r._out) {
      /* label sits clear of the building, joined by a leader — as on the survey sheets */
      var ax = r._side === 0 ? r._lx + colW : r._lx;
      gTxt.appendChild(el('line', { x1: ax, y1: r._ly + F * .25, x2: a[0], y2: a[1],
        stroke: '#9aa4ab', 'stroke-width': Math.max(.8, F * .045), 'stroke-dasharray': (F * .3) + ' ' + (F * .3) }));
      gTxt.appendChild(el('circle', { cx: a[0], cy: a[1], r: F * .16, fill: '#7b858c' }));
      var tA = r._side === 0 ? 'end' : 'start', tx = r._side === 0 ? r._lx + colW : r._lx;
      gTxt.appendChild(el('text', { x: tx, y: r._ly - F * .25, 'class': 'rname', 'text-anchor': tA,
        'font-size': F * .78, 'stroke-width': F * .19 }, r.num + '  ' + nameOf(r).toUpperCase()));
      gTxt.appendChild(el('text', { x: tx, y: r._ly + F * .85, 'class': 'rarea', 'text-anchor': tA,
        'font-size': F * .74, 'stroke-width': F * .19 }, roomArea(r)));
      gTxt.appendChild(el('text', { x: tx, y: r._ly + F * 1.75, 'class': 'rclg', 'text-anchor': tA,
        'font-size': F * .56, 'stroke-width': F * .16 }, roomArea2(r)));
    } else {
      /* type scales with the room, so a small room does not get a label bigger than itself */
      var rs = roomScale(r, F);
      gTxt.appendChild(el('text', { x: a[0], y: a[1] - rs * 0.55, 'class': 'rname',
        'font-size': rs * 0.92, 'stroke-width': rs * 0.22 }, r.num + '  ' + nameOf(r).toUpperCase()));
      gTxt.appendChild(el('text', { x: a[0], y: a[1] + rs * 0.62, 'class': 'rarea',
        'font-size': rs * 0.86, 'stroke-width': rs * 0.22 }, roomArea(r)));
      gTxt.appendChild(el('text', { x: a[0], y: a[1] + rs * 1.6, 'class': 'rclg',
        'font-size': rs * 0.6, 'stroke-width': rs * 0.18 }, roomArea2(r)));
    }

    var show = S.dims === 'all' || (S.dims === 'sel' && S.sel === r.id);
    if (show) drawEdgeDims(gDim, r, F, span);
  });

  overall(gDim, b, F);
  svg.appendChild(gRoom); svg.appendChild(gDim); svg.appendChild(gTxt);
}

/* characteristic type size for one room: big rooms get big type, small rooms stay legible */
function roomScale(r, F) {
  var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  r.poly.forEach(function (p) { b.x0 = Math.min(b.x0, p[0]); b.y0 = Math.min(b.y0, p[1]);
                                b.x1 = Math.max(b.x1, p[0]); b.y1 = Math.max(b.y1, p[1]); });
  var m = Math.min(b.x1 - b.x0, b.y1 - b.y0), d = Math.sqrt(r.sf * 144);
  return Math.max(F * 0.42, Math.min(F * 1.06, Math.min(m * 0.19, d * 0.115)));
}

function drawEdgeDims(g, r, F, span) {
  var c = centroid(r.poly), P = r.poly;
  var fs = roomScale(r, F) * (S.dims === 'all' ? 0.66 : 0.86);
  var per = 0;
  for (var n = 0; n < P.length; n++)
    per += Math.hypot(P[(n + 1) % P.length][0] - P[n][0], P[(n + 1) % P.length][1] - P[n][1]);
  for (var i = 0; i < P.length; i++) {
    var p = P[i], q = P[(i + 1) % P.length];
    var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    /* skip slivers, judged against this room's own size, not the whole floor */
    if (L < per * 0.055 || L < span * 0.012) continue;
    var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    var nx = -dy / L, ny = dx / L;                  /* normal */
    if ((mx + nx - c[0]) * (mx - c[0]) + (my + ny - c[1]) * (my - c[1]) < 0) { nx = -nx; ny = -ny; }
    var off = fs * 1.05;
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    var tx = mx + nx * off, ty = my + ny * off;
    g.appendChild(el('line', { x1: p[0] + nx * off * .45, y1: p[1] + ny * off * .45,
      x2: q[0] + nx * off * .45, y2: q[1] + ny * off * .45,
      'class': 'dimln', 'stroke-width': Math.max(1, fs * .07) }));
    var tn = el('text', { x: tx, y: ty, 'class': 'dimtx', 'font-size': fs,
      'stroke-width': fs * 0.24,
      transform: 'rotate(' + ang.toFixed(2) + ' ' + tx + ' ' + ty + ')',
      'dominant-baseline': 'middle' }, len(L));
    g.appendChild(tn);
  }
}

function overall(g, b, F) {
  var o = F * 2.4, w = b.x1 - b.x0, h = b.y1 - b.y0;
  g.appendChild(el('line', { x1: b.x0, y1: b.y0 - o, x2: b.x1, y2: b.y0 - o, 'class': 'ovl' }));
  g.appendChild(el('text', { x: (b.x0 + b.x1) / 2, y: b.y0 - o - F * .45, 'class': 'ovtx',
    'font-size': F * .75 }, len(w)));
  g.appendChild(el('line', { x1: b.x0 - o, y1: b.y0, x2: b.x0 - o, y2: b.y1, 'class': 'ovl' }));
  var ty = (b.y0 + b.y1) / 2, tx = b.x0 - o - F * .45;
  g.appendChild(el('text', { x: tx, y: ty, 'class': 'ovtx', 'font-size': F * .75,
    transform: 'rotate(-90 ' + tx + ' ' + ty + ')' }, len(h)));
}

/* ---------- 3D ---------- */
function project(x, y, z, o, k) {
  var ca = Math.cos(S.yaw), sa = Math.sin(S.yaw);
  var X1 = (x - o.cx) * ca + (y - o.cy) * sa;
  var Y1 = -(x - o.cx) * sa + (y - o.cy) * ca;
  var cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
  var Y2 = Y1 * cp - z * sp;
  var Z2 = Y1 * sp + z * cp;
  return { x: X1 * k, y: -Z2 * k, d: Y2 };
}
function draw3D() {
  var svg = document.getElementById('svg-3d');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  var list = rooms(), b = bbox(list);
  var o = { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2 };
  var span = Math.max(b.x1 - b.x0, b.y1 - b.y0);
  var k = S.zoom;
  var faces = [];

  list.forEach(function (r) {
    var h = r.clg || 0, P = r.poly, dim = (S.sel && S.sel !== r.id);
    var base = r.conf === 'scanned' ? [226, 223, 214] : (r.conf === 'owner' ? [223, 205, 196] : [228, 219, 200]);
    if (S.sel === r.id) base = [186, 212, 245];

    var fl = P.map(function (p) { return project(p[0], p[1], 0, o, k); });
    faces.push({ pts: fl, d: avg(fl), col: rgb(base, dim ? .5 : .72), id: r.id, kind: 'floor' });

    if (h > 0) for (var i = 0; i < P.length; i++) {
      var p = P[i], q = P[(i + 1) % P.length];
      var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
      if (L < 1) continue;
      var v = [project(p[0], p[1], 0, o, k), project(q[0], q[1], 0, o, k),
               project(q[0], q[1], h, o, k), project(p[0], p[1], h, o, k)];
      /* shade by wall orientation relative to the viewer */
      var nrm = Math.atan2(dy, dx) - S.yaw;
      var sh = 0.62 + 0.30 * Math.abs(Math.cos(nrm));
      /* wall sizes in 3D are shown for the room in hand — all of them at once is unreadable */
      faces.push({ pts: v, d: avg(v), col: rgb(base, (dim ? .55 : 1) * sh), id: r.id, kind: 'wall',
                   L: L, mid: project((p[0]+q[0])/2, (p[1]+q[1])/2, h * .55, o, k),
                   show: S.dims !== 'off' && S.sel === r.id && L > span * 0.03 });
    }
  });

  faces.sort(function (a, b2) { return b2.d - a.d; });
  var vb = extent(faces, span * k);
  svg.setAttribute('viewBox', vb.join(' '));
  var F = vb[2] / 46;

  var gF = el('g'), gL = el('g');
  faces.forEach(function (f) {
    var pl = el('polygon', { points: f.pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' '),
      fill: f.col, 'class': 'f3', 'stroke-width': Math.max(.6, F * .035), 'data-id': f.id });
    pl.addEventListener('click', function () { select(f.id); });
    gF.appendChild(pl);
    if (f.kind === 'wall' && f.show)
      gL.appendChild(el('text', { x: f.mid.x, y: f.mid.y, 'class': 'd3', 'font-size': F * .62,
        'dominant-baseline': 'middle' }, len(f.L)));
  });
  /* name plates: selected room first, then biggest first; drop any that would collide */
  var placed = [];
  function fits(cx, cy, w, h) {
    for (var i = 0; i < placed.length; i++) {
      var b2 = placed[i];
      if (Math.abs(cx - b2.x) * 2 < (w + b2.w) && Math.abs(cy - b2.y) * 2 < (h + b2.h)) return false;
    }
    placed.push({ x: cx, y: cy, w: w, h: h });
    return true;
  }
  list.slice().sort(function (x, y) {
    if ((S.sel === x.id) !== (S.sel === y.id)) return S.sel === x.id ? -1 : 1;
    return y.sf - x.sf;
  }).forEach(function (r) {
    var a = anchor(r.poly), pt = project(a[0], a[1], (r.clg || 0) + 16, o, k);
    var line1 = r.num + '  ' + nameOf(r).toUpperCase();
    var line2 = roomArea(r) + (r.clg ? '  ·  h ' + len(r.clg) : '');
    var w = Math.max(line1.length, line2.length) * F * .34, h = F * 1.55;
    if (!fits(pt.x, pt.y + F * .4, w, h)) return;
    gL.appendChild(el('text', { x: pt.x, y: pt.y, 'class': 'n3', 'font-size': F * .72 }, line1));
    gL.appendChild(el('text', { x: pt.x, y: pt.y + F * .8, 'class': 'd3', 'font-size': F * .6 }, line2));
  });
  svg.appendChild(gF); svg.appendChild(gL);
}
function avg(pts){ var s = 0; pts.forEach(function (p) { s += p.d; }); return s / pts.length; }
function rgb(c, m){ return 'rgb(' + Math.round(c[0]*m) + ',' + Math.round(c[1]*m) + ',' + Math.round(c[2]*m) + ')'; }
function extent(faces, span) {
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  faces.forEach(function (f) { f.pts.forEach(function (p) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }); });
  var pad = span * 0.11 + 30;
  return [x0 - pad + S.pan.x, y0 - pad + S.pan.y, (x1 - x0) + pad * 2, (y1 - y0) + pad * 2];
}

/* ---------- data view ---------- */
function drawData() {
  var d = document.getElementById('dataview'), h = '';
  h += '<h3>' + (S.lang === 'ru' ? 'Все помещения' : 'Every room') + '</h3>';
  h += '<table class="data"><thead><tr><th>#</th><th>' + t('room') + '</th><th>' + t('area') +
       '</th><th>' + t('clg') + '</th><th>' + t('perim') + '</th><th>' + t('vol') +
       '</th><th>W/D/Win</th><th>' + t('src') + '</th></tr></thead><tbody>';
  [1, 2].forEach(function (L) {
    h += '<tr class="lv"><td colspan="8">' + t('l' + L) + '</td></tr>';
    window.ROOMS.filter(function (r) { return r.level === L; }).forEach(function (r) {
      h += '<tr class="click" data-id="' + r.id + '"><td class="n">' + r.num + '</td>' +
        '<td class="n">' + esc(nameOf(r)) + '</td>' +
        '<td>' + roomArea(r) + '<br><span style="opacity:.6">' + roomArea2(r) + '</span></td>' +
        '<td>' + (r.clg ? len(r.clg) : '—') + '<br><span style="opacity:.55;font-size:10px">' +
          esc(S.lang === 'ru' ? r.clg_ru : r.clg_en) + '</span></td>' +
        '<td>' + (r.perim ? len(r.perim) : '—') + '</td>' +
        '<td>' + (volS(r.vol) || '—') + '</td>' +
        '<td>' + (r.walls != null ? r.walls + ' / ' + r.doors + ' / ' + r.wins : '—') + '</td>' +
        '<td><span class="tag ' + confClass(r.conf) + '">' + t(r.conf === 'scanned' ? 'scanned' :
          (r.conf === 'owner' ? 'owner' : 'approx')) + '</span> ' + esc(r.src) + '</td></tr>';
    });
  });
  h += '</tbody></table>';
  h += '<h3>' + t('still') + '</h3><ul class="miss">' + (S.lang === 'ru' ? [
    '<li>Кухня и кабинет — высота потолка не снята ни разу.</li>',
    '<li>Проём W кухня ↔ гостиная 2 — 3\'6.53" с одной стороны против цифры с другой. Единственное несходящееся место на 1-м этаже.</li>',
    '<li>Коридор 1-го этажа и гостиная 2 — сканы открытые, площадь снята с контура, а не из таблицы скана.</li>',
    '<li>Лестница — ширина марша, направление, число ступеней и размер проёма в перекрытии. Пока этого нет, два этажа нельзя совместить друг с другом.</li>',
    '<li>Коридор 2-го этажа — ширина поперёк.</li>',
    '<li>Спальня 1 — потолок в центре: кессон это или скат.</li>',
    '<li>Дверь G в спальне хозяев — куда ведёт, до сих пор неизвестно.</li>'].join('') : [
    '<li>Kitchen and study — the ceiling was never measured in either room.</li>',
    '<li>Opening W, kitchen ↔ living room 2 — 3\'6.53" on one side against the other side\'s figure. The only thing on Level 1 that does not close.</li>',
    '<li>Level 1 corridor and living room 2 — open scans; area comes from the traced outline, not from a scan table.</li>',
    '<li>Stair — width across the flight, run direction, tread count, and the size of the opening it makes in the Level 2 floor. Until that exists the two levels cannot be aligned to each other.</li>',
    '<li>Level 2 corridor — one width measurement across it.</li>',
    '<li>Bedroom 1 — the ceiling in the centre: tray or slope.</li>',
    '<li>Door G in the master bedroom — still has no known destination.</li>'].join('')) + '</ul>';
  d.innerHTML = h;
  Array.prototype.forEach.call(d.querySelectorAll('tr.click'), function (tr) {
    tr.addEventListener('click', function () {
      var r = byId(tr.getAttribute('data-id'));
      if (r.level !== S.level) { S.level = r.level; syncBtns(); }
      select(r.id);
    });
  });
}
function esc(s){ return String(s).replace(/[&<>"]/g, function (c) {
  return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]; }); }
function byId(id){ return window.ROOMS.filter(function (r) { return r.id === id; })[0]; }

/* ---------- side panel ---------- */
function panel() {
  var a = document.getElementById('aside');
  var r = S.sel ? byId(S.sel) : null;
  if (!r) { a.innerHTML = '<p class="note">' + t('nosel') + '</p>'; return; }
  var h = '<div class="num">' + t('l' + r.level) + ' · ' + r.num + '</div><h2>' + esc(nameOf(r)) + '</h2>';
  h += '<div class="tagrow"><span class="tag ' + confClass(r.conf) + '">' +
       t(r.conf === 'scanned' ? 'scanned' : (r.conf === 'owner' ? 'owner' : 'approx')) +
       '</span><span class="tag">' + esc(r.src) + '</span></div>';
  h += '<div class="grid">';
  h += cell(t('area'), roomArea(r), roomArea2(r));
  h += cell(t('clg'), r.clg ? len(r.clg) : '—', r.clg ? len2(r.clg) : null);
  if (r.perim) h += cell(t('perim'), len(r.perim), len2(r.perim));
  if (r.vol) h += cell(t('vol'), volS(r.vol), null);
  if (r.walls != null) {
    h += cell(t('walls'), String(r.walls), null);
    h += cell(t('doors') + ' / ' + t('wins'), r.doors + ' / ' + r.wins, null);
  }
  h += '<div class="cell wide"><div class="k">' + t('clg') + '</div><div class="v sm">' +
       esc(S.lang === 'ru' ? r.clg_ru : r.clg_en) + '</div></div>';
  h += '</div>';
  var note = S.lang === 'ru' ? r.note_ru : r.note_en;
  if (note) h += '<p class="note">' + esc(note) + '</p>';

  h += '<p class="ph-h">' + t('wallrun') + '</p><div class="walls">';
  var P = r.poly;
  for (var i = 0; i < P.length; i++) {
    var p = P[i], q = P[(i + 1) % P.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    h += '<div><b>' + (i + 1) + '</b> &nbsp; ' + len(L) + ' &nbsp; <span style="opacity:.6">' + len2(L) + '</span></div>';
  }
  h += '</div>';

  if (r.photos && r.photos.length) {
    h += '<p class="ph-h">' + t('photos') + ' · ' + r.photos.length + '</p><div class="shots">';
    r.photos.forEach(function (p) {
      h += '<figure><img loading="lazy" src="assets/photos/' + p.file + '" alt="' + esc(p.caption || nameOf(r)) + '">' +
           (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>';
    });
    h += '</div>';
  }
  a.innerHTML = h;
  a.scrollTop = 0;
}
function cell(k, v, v2) {
  return '<div class="cell"><div class="k">' + k + '</div><div class="v">' + v + '</div>' +
    (v2 ? '<div class="v2">' + v2 + '</div>' : '') + '</div>';
}

/* ---------- app ---------- */
function select(id) { S.sel = id; render(); }
function render() {
  document.getElementById('view-plan').classList.toggle('on', S.view === 'plan');
  document.getElementById('view-3d').classList.toggle('on', S.view === '3d');
  document.getElementById('view-data').classList.toggle('on', S.view === 'data');
  document.getElementById('hint').textContent = S.view === '3d' ? t('drag') : t('pick');
  document.getElementById('hint').style.display = S.view === 'data' ? 'none' : '';
  document.getElementById('legend').textContent = t('legend');
  document.getElementById('legend').style.display = S.view === 'data' ? 'none' : '';
  if (S.view === 'plan') drawPlan();
  if (S.view === '3d') draw3D();
  if (S.view === 'data') drawData();
  panel();
}
function syncBtns() {
  set('b-l1', S.level === 1); set('b-l2', S.level === 2);
  set('b-plan', S.view === 'plan'); set('b-3d', S.view === '3d'); set('b-data', S.view === 'data');
  set('b-ft', S.unit === 'ft'); set('b-m', S.unit === 'm');
  set('b-en', S.lang === 'en'); set('b-ru', S.lang === 'ru');
  set('b-dall', S.dims === 'all'); set('b-dsel', S.dims === 'sel'); set('b-doff', S.dims === 'off');
  ['b-l1','b-l2','b-plan','b-3d','b-data','b-dall','b-dsel','b-doff'].forEach(function (id) {
    var m = { 'b-l1':'l1','b-l2':'l2','b-plan':'plan','b-3d':'v3d','b-data':'data',
              'b-dall':'dAll','b-dsel':'dSel','b-doff':'dOff' };
    document.getElementById(id).textContent = t(m[id]);
  });
}
function set(id, on){ document.getElementById(id).setAttribute('aria-pressed', on ? 'true' : 'false'); }
function on(id, fn){ document.getElementById(id).addEventListener('click', fn); }

function init() {
  on('b-l1', function () { S.level = 1; S.sel = null; syncBtns(); render(); });
  on('b-l2', function () { S.level = 2; S.sel = null; syncBtns(); render(); });
  on('b-plan', function () { S.view = 'plan'; syncBtns(); render(); });
  on('b-3d', function () { S.view = '3d'; syncBtns(); render(); });
  on('b-data', function () { S.view = 'data'; syncBtns(); render(); });
  on('b-ft', function () { S.unit = 'ft'; syncBtns(); render(); });
  on('b-m', function () { S.unit = 'm'; syncBtns(); render(); });
  on('b-en', function () { S.lang = 'en'; document.documentElement.lang = 'en'; syncBtns(); render(); });
  on('b-ru', function () { S.lang = 'ru'; document.documentElement.lang = 'ru'; syncBtns(); render(); });
  on('b-dall', function () { S.dims = 'all'; syncBtns(); render(); });
  on('b-dsel', function () { S.dims = 'sel'; syncBtns(); render(); });
  on('b-doff', function () { S.dims = 'off'; syncBtns(); render(); });

  var svg3 = document.getElementById('svg-3d'), drag = null;
  svg3.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, y: e.clientY, yaw: S.yaw, pitch: S.pitch, moved: 0 };
    svg3.setPointerCapture(e.pointerId);
  });
  svg3.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    S.yaw = drag.yaw + dx * 0.006;
    S.pitch = Math.max(0.12, Math.min(1.52, drag.pitch + dy * 0.005));
    draw3D();
  });
  svg3.addEventListener('pointerup', function () { drag = null; });
  svg3.addEventListener('pointercancel', function () { drag = null; });
  svg3.addEventListener('wheel', function (e) {
    e.preventDefault();
    S.zoom = Math.max(0.35, Math.min(3.2, S.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    draw3D();
  }, { passive: false });

  var lb = document.getElementById('lb'), lbi = document.getElementById('lbimg');
  document.addEventListener('click', function (e) {
    if (e.target.tagName === 'IMG' && e.target.closest('.shots')) { lbi.src = e.target.src; lb.classList.add('on'); }
  });
  lb.addEventListener('click', function () { lb.classList.remove('on'); lbi.src = ''; });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lb.classList.contains('on')) { lb.classList.remove('on'); lbi.src = ''; }
    else if (S.sel) { S.sel = null; render(); }
  });
  window.addEventListener('resize', function () { if (S.view !== 'data') render(); });

  syncBtns(); render();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
