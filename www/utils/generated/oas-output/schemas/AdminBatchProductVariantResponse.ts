/**
 * @schema AdminBatchProductVariantResponse
 * type: object
 * description: SUMMARY
 * x-schemaName: AdminBatchProductVariantResponse
 * required:
 *   - created
 *   - updated
 *   - deleted
 * properties:
 *   created:
 *     type: array
 *     description: The product's created.
 *     items:
 *       $ref: "#/components/schemas/AdminProductVariant"
 *   updated:
 *     type: array
 *     description: The product's updated.
 *     items:
 *       $ref: "#/components/schemas/AdminProductVariant"
 *   deleted:
 *     type: object
 *     description: The product's deleted.
 *     required:
 *       - ids
 *       - object
 *       - deleted
 *     properties:
 *       ids:
 *         type: array
 *         description: The deleted's ids.
 *         items:
 *           type: string
 *           title: ids
 *           description: The id's ids.
 *       object:
 *         type: string
 *         title: object
 *         description: The deleted's object.
 *       deleted:
 *         type: boolean
 *         title: deleted
 *         description: The deleted's details.
 * 
*/

