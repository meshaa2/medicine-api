function notFound(res, message = "Resource not found") {
  return res.status(404).json({ error: { code: "NOT_FOUND", message } });
}

function badRequest(res, message = "Bad request") {
  return res.status(400).json({ error: { code: "BAD_REQUEST", message } });
}

module.exports = { notFound, badRequest };

