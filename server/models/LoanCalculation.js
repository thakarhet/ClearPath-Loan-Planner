import mongoose from 'mongoose';

const loanCalculationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loanType: { type: String, enum: ['home', 'personal'], required: true },
  principal: { type: Number, required: true, min: 1 },
  annualRate: { type: Number, required: true, min: 0 },
  tenureMonths: { type: Number, required: true, min: 1 },
  emi: { type: Number, required: true },
  totalInterest: { type: Number, required: true },
  totalPayment: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('LoanCalculation', loanCalculationSchema);
