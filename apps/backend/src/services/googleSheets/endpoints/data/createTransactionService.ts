import { insert, findById, update } from '../../';

// Expose CRUD operations used by data/createTransaction controller
export const createTransactionService = {
  insert,
  findById,
  update,
};

export default createTransactionService;
