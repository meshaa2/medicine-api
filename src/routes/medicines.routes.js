const express = require("express");
const router = express.Router();

const { medicines, batches } = require("../utils/dataStore");
const { paginate } = require("../utils/pagination");
const { notFound, badRequest } = require("../utils/response");
const { intParam, enumParam } = require("../utils/validate");
const { utcTodayYYYYMMDD, daysBetweenUTC } = require("../utils/date");

function totalQtyFor(medicineId) {
  return batches
    .filter((b) => b.medicine_id === medicineId)
    .reduce((sum, b) => sum + (b.quantity || 0), 0);
}

function computeStatus(med) {
  const total = totalQtyFor(med.medicine_id);
  if (med.status !== "active") return { total_quantity: total, status: "inactive" };
  if (total <= 0) return { total_quantity: total, status: "out_of_stock" };
  if (total <= med.reorder_level) return { total_quantity: total, status: "low_stock" };
  return { total_quantity: total, status: "available" };
}

function lowStockHandler(req, res) {
  const threshold = req.query.threshold;
  const t = threshold ? parseInt(threshold, 10) : null;
  if (threshold && Number.isNaN(t)) return badRequest(res, "threshold must be an integer");

  const results = medicines
    .map((m) => ({ ...m, ...computeStatus(m) }))
    .filter((m) => {
      if (m.status !== "low_stock") return false;
      return t === null ? true : m.total_quantity <= t;
    });

  return res.json({ meta: { total: results.length }, data: results });
}

// GET /medicines/low-stock?threshold=
// GET /medicines/low-stock/list?threshold=
router.get("/low-stock", lowStockHandler);
router.get("/low-stock/list", lowStockHandler);

function expiringSoonHandler(req, res) {
  const within = req.query.within_days ? parseInt(req.query.within_days, 10) : 30;
  if (Number.isNaN(within) || within < 1 || within > 365) {
    return badRequest(res, "within_days must be an integer between 1 and 365");
  }

  const today = utcTodayYYYYMMDD();

  const expiring = batches
    .map((b) => {
      const daysToExpiry = daysBetweenUTC(today, b.expiry_date);
      return { ...b, days_to_expiry: daysToExpiry };
    })
    .filter((b) => b.expiry_date >= today && b.days_to_expiry <= within);

  return res.json({
    as_of: today,
    within_days: within,
    total: expiring.length,
    data: expiring,
  });
}

// GET /medicines/expiring-soon?within_days=30
// GET /medicines/expiring-soon/list?within_days=30
router.get("/expiring-soon", expiringSoonHandler);
router.get("/expiring-soon/list", expiringSoonHandler);

function expirySummaryHandler(req, res) {
  const today = utcTodayYYYYMMDD();

  const computed = medicines.map((m) => ({ ...m, ...computeStatus(m) }));
  const lowStockCount = computed.filter((m) => m.status === "low_stock").length;
  const outOfStockCount = computed.filter((m) => m.status === "out_of_stock").length;

  const expiredBatches = batches.filter((b) => b.expiry_date < today).length;
  const expiring30 = batches
    .map((b) => ({ ...b, days_to_expiry: daysBetweenUTC(today, b.expiry_date) }))
    .filter((b) => b.expiry_date >= today && b.days_to_expiry <= 30).length;

  return res.json({
    as_of: today,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    expiring_within_30_days_batches: expiring30,
    expired_batches: expiredBatches,
  });
}

// GET /medicines/expiry-summary
// GET /medicines/expiry-summary/overview
router.get("/expiry-summary", expirySummaryHandler);
router.get("/expiry-summary/overview", expirySummaryHandler);

// GET /medicines?q=&category=&status=&limit=&offset=
router.get("/", (req, res) => {
  const { q, category, status, limit, offset } = req.query;

  const limitN = intParam(res, "limit", limit, { min: 1, max: 100 });
  if (limitN === undefined) return;
  const offsetN = intParam(res, "offset", offset, { min: 0, max: 100000 });
  if (offsetN === undefined) return;

  const allowedStatus = ["available", "low_stock", "out_of_stock", "inactive"];
  const statusV = enumParam(res, "status", status, allowedStatus);
  if (statusV === undefined) return;

  let results = medicines.map((m) => ({ ...m, ...computeStatus(m) }));

  if (q) {
    const s = String(q).toLowerCase();
    results = results.filter((m) => m.name.toLowerCase().includes(s));
  }
  if (category) results = results.filter((m) => m.category === category);
  if (status) results = results.filter((m) => m.status === status);

  return res.json(paginate(results, limitN ?? limit, offsetN ?? offset));
});

// GET /medicines/:id/batches
router.get("/:id/batches", (req, res) => {
  const med = medicines.find((m) => m.medicine_id === req.params.id);
  if (!med) return notFound(res, "Medicine not found");

  const today = utcTodayYYYYMMDD();
  const list = batches
    .filter((b) => b.medicine_id === req.params.id)
    .map((b) => {
      const daysToExpiry = daysBetweenUTC(today, b.expiry_date);
      const expiryStatus =
        b.expiry_date < today ? "expired" : daysToExpiry <= 30 ? "expiring_soon" : "valid";

      return { ...b, days_to_expiry: daysToExpiry, expiry_status: expiryStatus };
    });

  return res.json({ medicine_id: med.medicine_id, batches: list });
});

// GET /medicines/:id
router.get("/:id", (req, res) => {
  const med = medicines.find((m) => m.medicine_id === req.params.id);
  if (!med) return notFound(res, "Medicine not found");
  return res.json({ ...med, ...computeStatus(med) });
});

module.exports = router;
