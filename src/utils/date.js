function utcTodayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetweenUTC(fromYYYYMMDD, toYYYYMMDD) {
  const from = new Date(fromYYYYMMDD + "T00:00:00Z");
  const to = new Date(toYYYYMMDD + "T00:00:00Z");
  const diff = to.getTime() - from.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

module.exports = { utcTodayYYYYMMDD, daysBetweenUTC };

