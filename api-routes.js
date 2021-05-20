// api-routes.js
// Initialize express router
let router = require('express').Router();
// Set default API response
router.get('/', function (req, res) {
    res.json({
        status: 'API Its Working',
        message: 'Welcome to node server for api!',
    });
});
// Import contact controller
var contactController = require('./contactController');
// Contact routes
router.route('/contacts')
    .get(contactController.index)
    .post(contactController.new);

router.route('/contacts/:pincode/:age?')
    .get(contactController.view)
    .patch(contactController.update)
    .put(contactController.update)
    .delete(contactController.delete);


router.route('/getdata/:pincode?/:age?')
    .get(contactController.view);

// Export API routes
module.exports = router;