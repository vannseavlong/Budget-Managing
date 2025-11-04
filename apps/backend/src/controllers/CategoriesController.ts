// import { Request, Response } from 'express';
// import { GoogleSheetsService } from '../services/GoogleSheetsService';
// import { logger } from '../utils/logger';
// import { z } from 'zod';
// import { AuthenticatedRequest } from '../middleware/auth';
// import { v4 as uuidv4 } from 'uuid';

// // Validation schemas
// const createCategorySchema = z.object({
//   name: z.string().min(1, 'Category name is required'),
//   color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
// });

// const updateCategorySchema = z.object({
//   name: z.string().min(1, 'Category name is required').optional(),
//   color: z
//     .string()
//     .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
//     .optional(),
// });

// export class CategoriesController {
//   private googleSheetsService: GoogleSheetsService;

//   constructor() {
//     this.googleSheetsService = new GoogleSheetsService();
//   }

//   /**
//    * Get all categories for the authenticated user
//    */
//   async getCategories(req: Request, res: Response): Promise<void> {
//     try {
//       const authenticatedReq = req as AuthenticatedRequest;
//       const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

//       this.googleSheetsService.setCredentials(googleCredentials);

//       // Get all categories for this user
//       const categories = await this.googleSheetsService.find(
//         spreadsheetId,
//         'categories',
//         { user_id: authenticatedReq.user!.email } // Filter by user
//       );

//       res.status(200).json({
//         success: true,
//         data: categories,
//         message: 'Categories retrieved successfully',
//       });
//     } catch (error) {
//       logger.error('Error getting categories:', error);
//       res.status(500).json({
//         success: false,
//         message:
//           error instanceof Error ? error.message : 'Internal server error',
//       });
//     }
//   }

//   /**
//    * Create a new category
//    */
//   async createCategory(req: Request, res: Response): Promise<void> {
//     try {
//       const authenticatedReq = req as AuthenticatedRequest;
//       const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
//       const validatedData = createCategorySchema.parse(req.body);

//       this.googleSheetsService.setCredentials(googleCredentials);

//       // Check if category with same name already exists for this user
//       const existingCategories = await this.googleSheetsService.find(
//         spreadsheetId,
//         'categories',
//         {
//           user_id: authenticatedReq.user!.email,
//           name: validatedData.name,
//         }
//       );

//       if (existingCategories.length > 0) {
//         res.status(400).json({
//           success: false,
//           message: 'Category with this name already exists',
//         });
//         return;
//       }

//       // Create new category
//       const categoryData = {
//         id: uuidv4(),
//         user_id: authenticatedReq.user!.email,
//         name: validatedData.name,
//         color: validatedData.color,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       };

//       const categoryId = await this.googleSheetsService.insert(
//         spreadsheetId,
//         'categories',
//         categoryData
//       );

//       res.status(201).json({
//         success: true,
//         data: categoryData,
//         message: 'Category created successfully',
//       });
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         res.status(400).json({
//           success: false,
//           message: 'Validation error',
//           errors: error.errors,
//         });
//         return;
//       }

//       logger.error('Error creating category:', error);
//       res.status(500).json({
//         success: false,
//         message:
//           error instanceof Error ? error.message : 'Internal server error',
//       });
//     }
//   }

//   /**
//    * Update an existing category
//    */
//   async updateCategory(req: Request, res: Response): Promise<void> {
//     try {
//       const authenticatedReq = req as AuthenticatedRequest;
//       const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
//       const { id } = req.params;
//       const validatedData = updateCategorySchema.parse(req.body);

//       this.googleSheetsService.setCredentials(googleCredentials);

//       // Check if category exists and belongs to this user
//       const existingCategory = await this.googleSheetsService.findById(
//         spreadsheetId,
//         'categories',
//         id
//       );

//       if (
//         !existingCategory ||
//         existingCategory.user_id !== authenticatedReq.user!.email
//       ) {
//         res.status(404).json({
//           success: false,
//           message: 'Category not found',
//         });
//         return;
//       }

//       // Check if new name conflicts with existing categories (if name is being updated)
//       if (validatedData.name && validatedData.name !== existingCategory.name) {
//         const conflictingCategories = await this.googleSheetsService.find(
//           spreadsheetId,
//           'categories',
//           {
//             user_id: authenticatedReq.user!.email,
//             name: validatedData.name,
//           }
//         );

//         if (conflictingCategories.length > 0) {
//           res.status(400).json({
//             success: false,
//             message: 'Category with this name already exists',
//           });
//           return;
//         }
//       }

//       // Update the category
//       await this.googleSheetsService.update(
//         spreadsheetId,
//         'categories',
//         id,
//         validatedData
//       );

//       // Get updated category
//       const updatedCategory = await this.googleSheetsService.findById(
//         spreadsheetId,
//         'categories',
//         id
//       );

//       res.status(200).json({
//         success: true,
//         data: updatedCategory,
//         message: 'Category updated successfully',
//       });
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         res.status(400).json({
//           success: false,
//           message: 'Validation error',
//           errors: error.errors,
//         });
//         return;
//       }

//       logger.error('Error updating category:', error);
//       res.status(500).json({
//         success: false,
//         message:
//           error instanceof Error ? error.message : 'Internal server error',
//       });
//     }
//   }

//   /**
//    * Delete a category
//    */
//   async deleteCategory(req: Request, res: Response): Promise<void> {
//     try {
//       const authenticatedReq = req as AuthenticatedRequest;
//       const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
//       const { id } = req.params;

//       this.googleSheetsService.setCredentials(googleCredentials);

//       // Check if category exists and belongs to this user
//       const existingCategory = await this.googleSheetsService.findById(
//         spreadsheetId,
//         'categories',
//         id
//       );

//       if (
//         !existingCategory ||
//         existingCategory.user_id !== authenticatedReq.user!.email
//       ) {
//         res.status(404).json({
//           success: false,
//           message: 'Category not found',
//         });
//         return;
//       }

//       // Delete the category
//       await this.googleSheetsService.delete(spreadsheetId, 'categories', id);

//       res.status(200).json({
//         success: true,
//         message: 'Category deleted successfully',
//       });
//     } catch (error) {
//       logger.error('Error deleting category:', error);
//       res.status(500).json({
//         success: false,
//         message:
//           error instanceof Error ? error.message : 'Internal server error',
//       });
//     }
//   }
// }
