import { setCredentials, findById, find, remove as deleteRecord } from '../../';

export const deleteBudgetService = {
  setCredentials,
  findById,
  find,
  delete: deleteRecord,
};

export default deleteBudgetService;
