// The login page's artwork (the "glass" design): the lit bars and their roots, and the network
// behind them. Two layers, so the moving parts redraw only the back one and the blurred
// glows in front are painted once.
const OPEN = '<svg aria-hidden="true" focusable="false" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">';

export const LOGIN_SCENE = `${OPEN}
<defs>
<radialGradient id="g2-aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#34D399" stop-opacity="0.26"/><stop offset="0.5" stop-color="#34D399" stop-opacity="0.08"/><stop offset="1" stop-color="#34D399" stop-opacity="0"/></radialGradient>
<radialGradient id="g2-pool" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7BF0C4" stop-opacity="0.5"/><stop offset="1" stop-color="#34D399" stop-opacity="0"/></radialGradient>
<linearGradient id="g2-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9FCE2"/><stop offset="0.32" stop-color="#4BE0A8"/><stop offset="1" stop-color="#0E7450"/></linearGradient>
<linearGradient id="g2-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9FCE2"/><stop offset="0.45" stop-color="#34D399"/><stop offset="1" stop-color="#0E7450"/></linearGradient>
<linearGradient id="g2-cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.42"/><stop offset="0.2" stop-color="#FFFFFF" stop-opacity="0.10"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.82" stop-color="#03281C" stop-opacity="0.16"/><stop offset="1" stop-color="#03281C" stop-opacity="0.34"/></linearGradient>
<linearGradient id="g2-stem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#F4F1EA"/><stop offset="1" stop-color="#B9B19E"/></linearGradient>
<radialGradient id="g2-pearl" cx="50%" cy="50%" r="50%" fx="36%" fy="30%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#F4F1EA"/><stop offset="1" stop-color="#ABA28D"/></radialGradient>
<linearGradient id="g2-net" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7BF0C4" stop-opacity="0.38"/><stop offset="1" stop-color="#7BF0C4" stop-opacity="0.06"/></linearGradient>
<filter id="g2-glow" x="-80%" y="-60%" width="260%" height="220%"><feGaussianBlur stdDeviation="34"/></filter>
<filter id="g2-soft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="g2-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<ellipse cx="444" cy="440" rx="420" ry="360" fill="url(#g2-aura)"/>
<line x1="0" y1="456" x2="1440" y2="456" stroke="#34D399" stroke-opacity="0.16" stroke-width="1.2"/>
<g fill="none" stroke="url(#g2-net)" stroke-width="1.4" stroke-linecap="round">
<path d="M296 566 C 220 578, 120 596, 0 606"/>
<path d="M310 588 C 280 670, 210 790, 150 900"/>
<path d="M440 652 C 432 740, 410 830, 392 900"/>
<path d="M560 713 C 548 780, 520 850, 500 900"/>
<path d="M598 694 C 760 708, 1040 770, 1440 800"/>
<path d="M590 707 C 650 780, 740 850, 820 900"/>
</g>
<g fill="#7BF0C4" fill-opacity="0.5"><circle cx="134" cy="591" r="3"/><circle cx="241" cy="734" r="3"/><circle cx="414" cy="808" r="2.5"/><circle cx="698" cy="812" r="3"/><circle cx="930" cy="741" r="3"/><circle cx="1220" cy="784" r="2.5"/></g>
<g class="g2-motion">
<g opacity="0"><circle r="10" fill="#34D399" fill-opacity="0.35"/><circle r="3.4" fill="#F2FFF9"/><animateMotion dur="4.6s" begin="0s" repeatCount="indefinite" path="M0 606 C 120 596, 220 578, 296 566"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="4.6s" begin="0s" repeatCount="indefinite"/></g>
<g opacity="0"><circle r="10" fill="#34D399" fill-opacity="0.35"/><circle r="3.4" fill="#F2FFF9"/><animateMotion dur="4.2s" begin="-1.4s" repeatCount="indefinite" path="M150 900 C 210 790, 280 670, 310 588"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="4.2s" begin="-1.4s" repeatCount="indefinite"/></g>
<g opacity="0"><circle r="10" fill="#34D399" fill-opacity="0.35"/><circle r="3.4" fill="#F2FFF9"/><animateMotion dur="3.8s" begin="-2.6s" repeatCount="indefinite" path="M392 900 C 410 830, 432 740, 440 652"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="3.8s" begin="-2.6s" repeatCount="indefinite"/></g>
<g opacity="0"><circle r="10" fill="#34D399" fill-opacity="0.35"/><circle r="3.4" fill="#F2FFF9"/><animateMotion dur="7s" begin="-3s" repeatCount="indefinite" path="M1440 800 C 1040 770, 760 708, 598 694"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="7s" begin="-3s" repeatCount="indefinite"/></g>
<g opacity="0"><circle r="10" fill="#34D399" fill-opacity="0.35"/><circle r="3.4" fill="#F2FFF9"/><animateMotion dur="4.4s" begin="-0.7s" repeatCount="indefinite" path="M820 900 C 740 850, 650 780, 590 707"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="4.4s" begin="-0.7s" repeatCount="indefinite"/></g>
<circle cx="326" cy="562" r="32" fill="none" stroke="#34D399" stroke-width="2" opacity="0"><animate attributeName="r" values="32;66" dur="3.6s" begin="0s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="3.6s" begin="0s" repeatCount="indefinite"/></circle>
<circle cx="448" cy="623" r="32" fill="none" stroke="#34D399" stroke-width="2" opacity="0"><animate attributeName="r" values="32;66" dur="3.6s" begin="-1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="3.6s" begin="-1.2s" repeatCount="indefinite"/></circle>
<circle cx="570" cy="684" r="32" fill="none" stroke="#34D399" stroke-width="2" opacity="0"><animate attributeName="r" values="32;66" dur="3.6s" begin="-2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="3.6s" begin="-2.4s" repeatCount="indefinite"/></circle>
<circle cx="330" cy="290" r="2.2" fill="#B9FCE2" opacity="0"><animate attributeName="cy" values="290;70" dur="8s" begin="-2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="8s" begin="-2s" repeatCount="indefinite"/></circle>
<circle cx="456" cy="230" r="1.8" fill="#B9FCE2" opacity="0"><animate attributeName="cy" values="230;40" dur="10s" begin="-6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="10s" begin="-6s" repeatCount="indefinite"/></circle>
<circle cx="578" cy="170" r="2.4" fill="#B9FCE2" opacity="0"><animate attributeName="cy" values="170;20" dur="9s" begin="-1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.85;0" dur="9s" begin="-1s" repeatCount="indefinite"/></circle>
<circle cx="392" cy="270" r="1.5" fill="#B9FCE2" opacity="0"><animate attributeName="cy" values="270;90" dur="7.5s" begin="-4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.7;0" dur="7.5s" begin="-4s" repeatCount="indefinite"/></circle>
<circle cx="626" cy="210" r="1.6" fill="#B9FCE2" opacity="0"><animate attributeName="cy" values="210;30" dur="11s" begin="-3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.75;0" dur="11s" begin="-3s" repeatCount="indefinite"/></circle>
</g>
</svg>${OPEN}
<ellipse cx="440" cy="458" rx="310" ry="48" fill="url(#g2-pool)"/>
<g filter="url(#g2-glow)" fill="#34D399" fill-opacity="0.5"><rect x="288" y="322" width="76" height="106" rx="38"/><rect x="410" y="261" width="76" height="167" rx="38"/><rect x="532" y="200" width="76" height="228" rx="38"/><rect x="212" y="446" width="457" height="30" rx="15"/></g>
<g fill="#34D399" fill-opacity="0.16"><circle cx="326" cy="562" r="50"/><circle cx="448" cy="623" r="50"/><circle cx="570" cy="684" r="50"/></g>
<g fill="url(#g2-stem)"><rect x="315.5" y="494" width="21" height="68" rx="10.5"/><rect x="437.5" y="494" width="21" height="129" rx="10.5"/><rect x="559.5" y="494" width="21" height="190" rx="10.5"/></g>
<g fill="url(#g2-pearl)"><circle cx="326" cy="562" r="30"/><circle cx="448" cy="623" r="30"/><circle cx="570" cy="684" r="30"/></g>
<g fill="#FFFFFF" fill-opacity="0.9" filter="url(#g2-soft)"><ellipse cx="317" cy="551" rx="9" ry="6"/><ellipse cx="439" cy="612" rx="9" ry="6"/><ellipse cx="561" cy="673" rx="9" ry="6"/></g>
<rect x="212" y="441" width="457" height="30" rx="15" fill="url(#g2-beam)" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5"/>
<rect x="232" y="445" width="417" height="5" rx="2.5" fill="#FFFFFF" fill-opacity="0.55"/>
<g stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5"><rect x="288" y="312" width="76" height="106" rx="38" fill="url(#g2-bar)"/><rect x="410" y="251" width="76" height="167" rx="38" fill="url(#g2-bar)"/><rect x="532" y="190" width="76" height="228" rx="38" fill="url(#g2-bar)"/></g>
<g fill="url(#g2-cyl)"><rect x="288" y="312" width="76" height="106" rx="38"/><rect x="410" y="251" width="76" height="167" rx="38"/><rect x="532" y="190" width="76" height="228" rx="38"/></g>
<g fill="#FFFFFF" fill-opacity="0.32"><rect x="301" y="338" width="9" height="54" rx="4.5"/><rect x="423" y="277" width="9" height="115" rx="4.5"/><rect x="545" y="216" width="9" height="176" rx="4.5"/></g>
<g fill="#FFFFFF" fill-opacity="0.6" filter="url(#g2-soft)"><ellipse cx="316" cy="332" rx="16" ry="9"/><ellipse cx="438" cy="271" rx="16" ry="9"/><ellipse cx="560" cy="210" rx="16" ry="9"/></g>
<rect x="0" y="0" width="1440" height="900" filter="url(#g2-grain)" opacity="0.05"/>
</svg>`;

// The brand's mark and name, for a site that has not uploaded a logo of its own.
export const LOGIN_LOGO = `<svg width="38" height="41" viewBox="0 0 48 52" aria-hidden="true"><rect x="8" y="15" width="7" height="11" rx="3.5" fill="#34D399"/><rect x="20.5" y="9" width="7" height="17" rx="3.5" fill="#34D399"/><rect x="33" y="2" width="7" height="24" rx="3.5" fill="#34D399"/><line x1="4" y1="30" x2="44" y2="30" stroke="#34D399" stroke-width="3" stroke-linecap="round"/><g stroke="#F4F1EA" stroke-width="2.2" stroke-linecap="round"><line x1="11.5" y1="33" x2="11.5" y2="38.5"/><line x1="24" y1="33" x2="24" y2="42.5"/><line x1="36.5" y1="33" x2="36.5" y2="46.5"/></g><g fill="#F4F1EA"><circle cx="11.5" cy="40.5" r="2.8"/><circle cx="24" cy="44.5" r="2.8"/><circle cx="36.5" cy="48.5" r="2.8"/></g></svg><span class="ms-login-logo-text"><span>Digital Roots</span><span>Solutions</span></span>`;
