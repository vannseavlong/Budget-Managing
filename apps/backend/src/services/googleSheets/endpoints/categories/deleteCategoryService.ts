import { setCredentials, findById, remove as deleteRecord } from '../../';

export const deleteCategoryService = {
  setCredentials,
  findById,
  delete: deleteRecord,
};

export default deleteCategoryService;
