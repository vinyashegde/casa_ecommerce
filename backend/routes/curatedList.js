const express = require("express");
const {
  getAllCuratedLists,
  getUserCuratedList,
  createCuratedList,
  addProductToList,
  removeProductFromList,
  deleteCuratedList,
} = require("../controllers/curatedListController");

const router = express.Router();

router.get("/", getAllCuratedLists);
router.get("/:userId", getUserCuratedList);
router.post("/", createCuratedList);
router.put("/add", addProductToList);
router.put("/remove", removeProductFromList);
router.delete("/", deleteCuratedList);

module.exports = router;
