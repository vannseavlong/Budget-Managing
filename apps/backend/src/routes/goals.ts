import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  checkGoalProgress,
} from '../controllers/goals';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/goals:
 *   get:
 *     summary: Get all goals
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Goals retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getGoals);

/**
 * @swagger
 * /api/v1/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - limit_amount
 *               - period
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Monthly Groceries"
 *               limit_amount:
 *                 type: number
 *                 example: 500
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *                 example: "monthly"
 *               notify_telegram:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Goal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', createGoal);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   put:
 *     summary: Update a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goal not found
 */
router.put('/:id', updateGoal);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goal not found
 */
router.delete('/:id', deleteGoal);

/**
 * @swagger
 * /api/v1/goals/{id}/progress:
 *   get:
 *     summary: Check goal progress
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal progress retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goal not found
 */
router.get('/:id/progress', checkGoalProgress);

export default router;
