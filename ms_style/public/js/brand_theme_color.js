// The identity's green on the Android status bar. A Trusted Web Activity (the GESC app)
// colours it from the open page's <meta name="theme-color">, which Frappe's desk template
// sets to its own blue; this keeps the meta on the brand colour on every page, desk and
// website alike, and puts it back if a page changes it.
(function () {
  var BRAND = '#0E3B2E';
  function apply() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    if (m.content !== BRAND) m.setAttribute('content', BRAND);
  }
  apply();
  new MutationObserver(apply).observe(document.head,
    { childList: true, subtree: true, attributes: true, attributeFilter: ['content'] });
})();
