const userServices = require("../services/userServices");

/**
 * Controller để tìm kiếm user
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
 */

exports.queryUsers = async (req, res) => {
    try {
        const result = await userServices.queryUsers();
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// // Get All User
// const getAllUsers = async (req, res) => {
//     try {
//         const users = await userServices.getAllUsers();

//         return res.status(200).json({
//             success: true,
//             message: 'Get all users successfully',
//             data: users
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: 'Error fetching users',
//             error: error.message
//         });
//     }
// };

module.exports = {
    getAllUsers,
};


// Cập nhật thông tin
exports.updateUserInfo = async (req, res) => {
    const userId = req.params.id;
    const updateData = req.body;
    try {
        const updatedUser = await userServices.queryUser(userId, updateData);

        return res.status(200).json(updatedUser);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

