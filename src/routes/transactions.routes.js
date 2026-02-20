const express = require("express");
const router = express.Router();

const { transactions } = require("../utils/dataStore");
const { paginate } = require("../utils/pagination");
const { notFound } = require("../utils/response");
const { intParam, enumParam, dateParam, dateRange } = require("../utils/validate");

// GET /transactions?medicine_id=&type=&from=&to=&limit=&offset=
router.get("/", (req, res) => {
  const { medicine_id, type, from, to, limit, offset } = req.query;

  const limitN = intParam(res, "limit", limit, { min: 1, max: 100 });
  if (limitN === undefined) return;
  const offsetN = intParam(res, "offset", offset, { min: 0, max: 100000 });
  if (offsetN === undefined) return;

  const typeV = enumParam(res, "type", type, ["restock", "dispense", "adjust"]);
  if (typeV === undefined) return;

  const fromV = dateParam(res, "from", from);
  if (fromV === undefined) return;
  const toV = dateParam(res, "to", to);
  if (toV === undefined) return;
  const ok = dateRange(res, fromV ?? from, toV ?? to);
  if (ok === undefined) return;

  let results = [...transactions];
  if (medicine_id) results = results.filter((t) => t.medicine_id === medicine_id);
  if (type) results = results.filter((t) => t.type === type);
  if (from) results = results.filter((t) => t.transaction_date >= from);
  if (to) results = results.filter((t) => t.transaction_date <= to);

  return res.json(paginate(results, limitN ?? limit, offsetN ?? offset));
});

// GET /transactions/:id
router.get("/:id", (req, res) => {
  const t = transactions.find((x) => x.transaction_id === req.params.id);
  if (!t) return notFound(res, "Transaction not found");
  return res.json(t);
});

module.exports = router;

