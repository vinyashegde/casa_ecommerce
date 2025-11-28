const InventoryValueService = require("../services/inventoryValueService");

class InventoryValueController {
  /**
   * Get total inventory value for all products
   */
  static async getTotalInventoryValue(req, res) {
    try {
      const { brandId } = req.query;

      const result = await InventoryValueService.calculateTotalInventoryValue(
        brandId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting total inventory value:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate inventory value",
      });
    }
  }

  /**
   * Get inventory value summary for dashboard
   */
  static async getInventorySummary(req, res) {
    try {
      const { brandId } = req.query;

      const result = await InventoryValueService.getInventorySummary(brandId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting inventory summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get inventory summary",
      });
    }
  }

  /**
   * Get detailed breakdown of inventory value
   */
  static async getInventoryBreakdown(req, res) {
    try {
      const { brandId } = req.query;
      const { page = 1, limit = 50 } = req.query;

      const result = await InventoryValueService.calculateTotalInventoryValue(
        brandId
      );

      // Paginate the breakdown
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedBreakdown = result.breakdown.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          ...result,
          breakdown: paginatedBreakdown,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(result.breakdown.length / limit),
            totalItems: result.breakdown.length,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error getting inventory breakdown:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get inventory breakdown",
      });
    }
  }
}

module.exports = InventoryValueController;
