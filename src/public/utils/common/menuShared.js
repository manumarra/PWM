export function sortMenuProducts(products) {
  const getRank = (p) => {
    if ((p.discount || 0) > 0 && p.available) return 1;
    if (p.available) return 2;
    return 3;
  };

  return [...products].sort((a, b) => {
    const diff = getRank(a) - getRank(b);
    return diff !== 0 ? diff : (a.nameMeal || "").localeCompare(b.nameMeal || "");
  });
}

export function updateCounters(products) {
  const availableCount = products.filter((p) => p.available).length;
  const unavailableCount = products.length - availableCount;
  const discountedCount = products.filter((p) => (p.discount || 0) > 0 && p.available).length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("countAvailable", availableCount);
  set("countUnavailable", unavailableCount);
  set("countDiscounted", discountedCount);
}