import { setCredentials, findById, remove as deleteRecord } from '../../';

export const deleteBudgetItemService = {
  setCredentials,
  findById,
  delete: deleteRecord,
};

export default deleteBudgetItemService;
