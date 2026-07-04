const express = require('express');
const router  = express.Router();
const {
  getUsers, getUser, createUser, updateUser, deleteUser, toggleUserStatus, resetPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

router.use(protect, adminOnly);

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/toggle-status',  toggleUserStatus);
router.put('/:id/reset-password', resetPassword);

module.exports = router;
