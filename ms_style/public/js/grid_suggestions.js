// The suggestions of a Link cell in a child table: Frappe moves them under the table field
// and sets them at the cell's left edge (grid_row.js), which in Arabic, wider than a
// narrow cell, runs past the table's right. Set them at the cell's right edge instead.
// On phones the stylesheet gives them the table's width (forms.scss).
(() => {
  const phone = () => window.matchMedia("(max-width: 767px)").matches;

  document.addEventListener("focusin", (event) => {
    if (document.documentElement.dir !== "rtl" || phone()) return;
    const cell = event.target.closest?.(".grid-static-col");
    const field = cell?.closest(".grid-field");
    if (!field) return;
    // After Frappe's own handler on the cell has placed them.
    setTimeout(() => {
      const list = cell.querySelector(".awesomplete > ul") || field.querySelector(":scope > .awesomplete > ul");
      const wrapper = list?.parentElement;
      if (!wrapper || wrapper.parentElement !== field) return;
      const input = event.target.getBoundingClientRect();
      const box = field.getBoundingClientRect();
      const width = wrapper.getBoundingClientRect().width;
      wrapper.style.left = `${Math.max(0, input.right - box.left - width)}px`;
    });
  });
})();
