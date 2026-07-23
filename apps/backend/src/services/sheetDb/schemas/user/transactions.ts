import { defineTable, string, number, date } from 'longcelot-sheet-db';

export default defineTable({
  name: 'transactions',
  actor: 'user',
  timestamps: true,
  softDelete: true,
  columns: {
    name: string().required(),
    amount: number().required().min(0),
    category_id: string().required().ref('categories._id'),
    category_name: string(),
    date: date().required(),
    time: string(),
    notes: string(),
    receipt_url: string(),
  },
});
