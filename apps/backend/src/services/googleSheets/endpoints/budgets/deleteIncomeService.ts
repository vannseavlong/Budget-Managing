import {
  setCredentials,
  ensureTableExists,
  find,
  remove as deleteRecord,
} from '../../';

export const deleteIncomeService = {
  setCredentials,
  ensureTableExists,
  find,
  delete: deleteRecord,
};

export default deleteIncomeService;
