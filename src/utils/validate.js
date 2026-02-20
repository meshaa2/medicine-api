const { badRequest } = require("./response");

function intParam(res, name, value, { min = 0, max = 100 } = {}) {
  if (value === undefined) return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) {
    badRequest(res, `${name} must be an integer`);
    return undefined;
  }
  if (n < min) {
    badRequest(res, `${name} must be >= ${min}`);
    return undefined;
  }
  if (n > max) {
    badRequest(res, `${name} must be <= ${max}`);
    return undefined;
  }
  return n;
}

function enumParam(res, name, value, allowed) {
  if (value === undefined) return null;
  if (!allowed.includes(value)) {
    badRequest(res, `${name} must be one of: ${allowed.join(", ")}`);
    return undefined;
  }
  return value;
}

function isYYYYMMDD(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function dateParam(res, name, value) {
  if (value === undefined) return null;
  if (!isYYYYMMDD(value)) {
    badRequest(res, `${name} must be YYYY-MM-DD`);
    return undefined;
  }
  return value;
}

function dateRange(res, from, to) {
  if (from && to && from > to) {
    badRequest(res, "from must be <= to");
    return undefined;
  }
  return true;
}

module.exports = { intParam, enumParam, dateParam, dateRange };

