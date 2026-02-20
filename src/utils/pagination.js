function paginate(items, limit = 20, offset = 0) {
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const o = Math.max(0, parseInt(offset, 10) || 0);

  return {
    meta: { limit: l, offset: o, total: items.length },
    data: items.slice(o, o + l),
  };
}

module.exports = { paginate };

