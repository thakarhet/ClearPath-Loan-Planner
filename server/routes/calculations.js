import { Router } from 'express';
import LoanCalculation from '../models/LoanCalculation.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function calculate({ principal, annualRate, tenureMonths }) {
  const P = Number(principal), annual = Number(annualRate), months = Number(tenureMonths);
  if (![P, annual, months].every(Number.isFinite) || P <= 0 || annual < 0 || months <= 0 || !Number.isInteger(months)) {
    const error = new Error('Enter a positive loan amount, a non-negative interest rate, and a whole-number tenure.');
    error.status = 400;
    throw error;
  }
  const rate = annual / 1200;
  const emi = rate === 0 ? P / months : P * rate * (1 + rate) ** months / ((1 + rate) ** months - 1);
  return { emi, totalPayment: emi * months, totalInterest: emi * months - P };
}

router.post('/', async (req, res, next) => {
  try {
    const { loanType, principal, annualRate, tenureMonths } = req.body;
    if (!['home', 'personal'].includes(loanType)) return res.status(400).json({ message: 'Choose a valid loan type.' });
    const result = calculate({ principal, annualRate, tenureMonths });
    const saved = await LoanCalculation.create({ user: req.user._id, loanType, principal, annualRate, tenureMonths, ...result });
    res.status(201).json(saved);
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const rows = await LoanCalculation.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20).lean();
    res.json(rows);
  } catch (error) { next(error); }
});
export default router;
