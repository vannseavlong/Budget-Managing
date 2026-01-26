import { setCredentials, findById, remove as deleteRecord } from '../../';

export const deleteGoalService = {
  setCredentials,
  findById,
  delete: deleteRecord,
};

export default deleteGoalService;
