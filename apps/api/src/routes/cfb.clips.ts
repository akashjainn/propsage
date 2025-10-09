import { Router } from 'express';

// Placeholder for deprecated/removed CFB clips route.
// This file previously contained corrupted content causing TypeScript build failures.
// Keeping a minimal router here ensures the compiler stays happy until the route is re-implemented or fully removed.

const r = Router();

r.get('/', (_req, res) => {
  res.status(410).json({
    error: 'CFB clips route has been removed',
    message: 'This endpoint is deprecated. Use /cfb/evidence or NFL routes instead.',
  });
});

export default r;