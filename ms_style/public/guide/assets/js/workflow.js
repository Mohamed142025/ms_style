/* Digital Roots ERPNext Guide — workflow diagram renderer.
 * Pure function: workflow spec + language -> SVG string.
 * Shared by the website (browser) and the Word builder (Node, rendered to PNG). */
(function (root) {
  const COLW = 238, ROWH = 132, NW = 164, NH = 74, DW = 150, DH = 92, PAD = 28;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function wrap(text, max, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = kept[maxLines - 1].replace(/.{0,2}$/, '') + '…';
      return kept;
    }
    return lines;
  }

  function render(wf, lang, opts) {
    opts = opts || {};
    const rtl = lang === 'ar';
    const nodes = (wf.nodes || []).map((n) => Object.assign({}, n));
    if (!nodes.length) return '';
    const maxCol = Math.max(...nodes.map((n) => n.col || 0));
    const maxRow = Math.max(...nodes.map((n) => n.row || 0));
    const minRow = Math.min(...nodes.map((n) => n.row || 0));
    const byId = {};
    // vertical: steps flow top→bottom (col → y) and lanes sit side by side (row → x); used for print.
    const V = !!opts.vertical, LANE = 196, STEP = 124;
    const maxR = maxRow - minRow;
    nodes.forEach((n) => {
      const c = rtl ? maxCol - (n.col || 0) : (n.col || 0);
      if (V) {
        const r = rtl ? maxR - ((n.row || 0) - minRow) : (n.row || 0) - minRow;
        n.cx = PAD + r * LANE + LANE / 2;
        n.cy = PAD + (n.col || 0) * STEP + STEP / 2;
      } else {
        n.cx = PAD + c * COLW + COLW / 2;
        n.cy = PAD + ((n.row || 0) - minRow) * ROWH + ROWH / 2;
      }
      const isD = n.type === 'decision';
      n.w = isD ? DW : NW;
      n.h = isD ? DH : NH;
      byId[n.id] = n;
    });
    const backEdges = (wf.edges || []).filter((e) => byId[e.from] && byId[e.to] && (byId[e.to].col || 0) < (byId[e.from].col || 0));
    const W = V ? PAD * 2 + (maxR + 1) * LANE + (backEdges.length ? 40 : 0) : PAD * 2 + (maxCol + 1) * COLW;
    const H = V ? PAD * 2 + (maxCol + 1) * STEP : PAD * 2 + (maxRow - minRow + 1) * ROWH + (backEdges.length ? 30 : 0);
    const backX0 = PAD + (maxR + 1) * LANE;
    const fwd = rtl ? -1 : 1;

    let defs = `<defs>
      <marker id="wfa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="wf-arrow"/></marker>
      <filter id="wfs" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0E3B2E" flood-opacity=".14"/></filter>
    </defs>`;

    let edges = '', labels = '';
    let backIdx = 0;
    for (const e of wf.edges || []) {
      const a = byId[e.from], b = byId[e.to];
      if (!a || !b) continue;
      let d, lx, ly;
      const ac = a.col || 0, bc = b.col || 0;
      if (V) {
        if (bc > ac) {
          const sy = a.cy + a.h / 2, ty = b.cy - b.h / 2;
          if (Math.abs(a.cx - b.cx) < 1) { d = `M${a.cx},${sy} V${ty}`; lx = a.cx; ly = bc - ac > 1 ? sy + 22 : (sy + ty) / 2 + 4; }
          else { const my = sy + Math.min((ty - sy) / 2, (STEP - NH) / 2 + 4); d = `M${a.cx},${sy} V${my} H${b.cx} V${ty}`; lx = a.cx; ly = sy + 15; }
        } else if (bc === ac) {
          const right = b.cx > a.cx;
          const sx = a.cx + (right ? a.w / 2 : -a.w / 2), tx = b.cx + (right ? -b.w / 2 : b.w / 2);
          d = `M${sx},${a.cy} H${tx}`; lx = (sx + tx) / 2; ly = a.cy - 9;
        } else {
          backIdx++;
          const lane = backX0 + 8 + backIdx * 8;
          d = `M${a.cx + a.w / 2},${a.cy} H${lane} V${b.cy} H${b.cx + b.w / 2}`; lx = lane - 4; ly = (a.cy + b.cy) / 2;
        }
      } else if (bc > ac) {
        const sx = a.cx + fwd * a.w / 2, sy = a.cy;
        const tx = b.cx - fwd * b.w / 2, ty = b.cy;
        if (Math.abs(sy - ty) < 1) { d = `M${sx},${sy} H${tx}`; lx = (sx + tx) / 2; ly = sy - 9; }
        else {
          const mx = sx + fwd * Math.min(Math.abs(tx - sx) / 2, COLW / 2 - 8);
          d = `M${sx},${sy} H${mx} V${ty} H${tx}`; lx = (mx + tx) / 2; ly = ty - 9;
        }
      } else if (bc === ac) {
        const down = b.cy > a.cy;
        const sy = a.cy + (down ? a.h / 2 : -a.h / 2), ty = b.cy + (down ? -b.h / 2 : b.h / 2);
        d = `M${a.cx},${sy} V${ty}`; lx = a.cx; ly = Math.abs(ty - sy) > ROWH ? sy + (down ? 24 : -14) : (sy + ty) / 2 + 4;
      } else {
        backIdx++;
        const sy = a.cy + a.h / 2, ty = b.cy + b.h / 2;
        const laneY = Math.max(sy, ty) + 18 + backIdx * 8;
        d = `M${a.cx},${sy} V${laneY} H${b.cx} V${ty}`; lx = (a.cx + b.cx) / 2; ly = laneY - 6;
      }
      edges += `<path d="${d}" class="wf-edge${e.dashed ? ' wf-dashed' : ''}" marker-end="url(#wfa)"/>`;
      const lab = e.label && e.label[lang];
      if (lab) {
        const ls = wrap(lab, 13, 2);
        const tw = Math.max(...ls.map((l) => l.length)) * 6 + 12;
        const th = ls.length * 13 + 5;
        const top = ls.length > 1 ? ly - th + 4 : ly - 12;
        labels += `<g class="wf-elabel"><rect x="${lx - tw / 2}" y="${top}" width="${tw}" height="${th}" rx="8"/>${ls.map((l, k) => `<text x="${lx}" y="${top + 13 + k * 13 - 2}" text-anchor="middle">${esc(l)}</text>`).join('')}</g>`;
      }
    }

    let shapes = '';
    for (const n of nodes) {
      const label = (n.label && n.label[lang]) || n.id;
      const type = n.type || 'doc';
      const x = n.cx - n.w / 2, y = n.cy - n.h / 2;
      const dt = n.doctype && type !== 'start' && type !== 'end' && n.doctype.toLowerCase() !== String(label).toLowerCase() ? n.doctype : '';
      let shape;
      if (type === 'decision') {
        shape = `<path d="M${n.cx},${y} L${x + n.w},${n.cy} L${n.cx},${y + n.h} L${x},${n.cy} Z" class="wf-shape wf-decision" filter="url(#wfs)"/>`;
      } else if (type === 'start' || type === 'end') {
        shape = `<rect x="${x}" y="${y + 8}" width="${n.w}" height="${n.h - 16}" rx="${(n.h - 16) / 2}" class="wf-shape wf-${type}" filter="url(#wfs)"/>`;
      } else {
        shape = `<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="12" class="wf-shape wf-${type}" filter="url(#wfs)"/>`;
        const bx = rtl ? x + n.w - 5 : x;
        shape += `<rect x="${bx}" y="${y + 10}" width="5" height="${n.h - 20}" rx="2.5" class="wf-bar wf-bar-${type}"/>`;
      }
      const maxChars = type === 'decision' ? 14 : 19;
      const lines = wrap(label, maxChars, type === 'decision' ? 3 : (dt ? 2 : 3));
      const lh = 15;
      const block = lines.length * lh + (dt ? 13 : 0);
      let ty = n.cy - block / 2 + 11;
      let txt = '';
      for (const l of lines) { txt += `<text x="${n.cx}" y="${ty}" text-anchor="middle" class="wf-label wf-label-${type}">${esc(l)}</text>`; ty += lh; }
      if (dt) txt += `<text x="${n.cx}" y="${ty + 1}" text-anchor="middle" class="wf-dt" direction="ltr">${esc(dt.length > 24 ? dt.slice(0, 23) + '…' : dt)}</text>`;
      const realDt = n.doctype && type !== 'start' && type !== 'end' ? n.doctype : '';
      const attrs = realDt ? ` data-doctype="${esc(realDt)}" tabindex="0" role="button"` : '';
      shapes += `<g class="wf-node wf-node-${type}"${attrs}><title>${esc(label)}${dt ? ' — ' + esc(dt) : ''}</title>${shape}${txt}</g>`;
    }

    const style = opts.inlineStyle ? `<style>${INLINE_CSS}</style>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="wf-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" direction="${rtl ? 'rtl' : 'ltr'}" role="img" aria-label="${esc((wf.title && wf.title[lang]) || '')}">${style}${defs}<g>${edges}</g><g>${shapes}</g><g>${labels}</g></svg>`;
  }

  // Light-theme styling used when the SVG is rendered outside the site (Word export).
  const INLINE_CSS = `
    text{font-family:'Cairo','IBM Plex Sans Arabic',Arial,sans-serif}
    .wf-edge{fill:none;stroke:#7C9A8E;stroke-width:1.8}
    .wf-dashed{stroke-dasharray:6 5}
    .wf-arrow{fill:#7C9A8E}
    .wf-shape{stroke-width:1.4}
    .wf-doc{fill:#FFFFFF;stroke:#B9D3C8}
    .wf-action{fill:#F4F1EA;stroke:#C9BFA8;stroke-dasharray:5 4}
    .wf-report{fill:#EEF6FA;stroke:#9CC5D6}
    .wf-decision{fill:#FFF6E6;stroke:#E2B866}
    .wf-start{fill:#34D399;stroke:#1FAF7C}
    .wf-end{fill:#0E3B2E;stroke:#0E3B2E}
    .wf-bar-doc{fill:#197B57}.wf-bar-action{fill:#B7791F}.wf-bar-report{fill:#287A9B}
    .wf-label{font-size:13px;font-weight:700;fill:#16211C}
    .wf-label-end{fill:#F4F1EA}
    .wf-label-start{fill:#0E3B2E}
    .wf-dt{font-size:10.5px;fill:#197B57;font-family:'Sora','Cairo',Arial,sans-serif;font-weight:600}
    .wf-elabel rect{fill:#FFFFFF;stroke:#D8E4DE}
    .wf-elabel text{font-size:10.5px;fill:#3D5A4F;font-weight:600}`;

  const api = { render, INLINE_CSS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DRWorkflow = api;
})(typeof window !== 'undefined' ? window : globalThis);
