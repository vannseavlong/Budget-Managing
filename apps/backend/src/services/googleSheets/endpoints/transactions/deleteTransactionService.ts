import {
  setCredentials,
  findById,
  remove as deleteRecord,
  update,
  find,
  insert,
} from '../../';

export const deleteTransactionService = {
  setCredentials,
  findById,
  delete: deleteRecord,
  update,
  find,
  insert,
};

export default deleteTransactionService;
