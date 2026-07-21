import { setCredentials, findById, remove as deleteRecord } from '../../';

export const deleteAccountService = {
  setCredentials,
  findById,
  delete: deleteRecord,
};

export default deleteAccountService;
