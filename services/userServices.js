const User = require("../models/User");

/**
 * Tìm kiếm user
 */
exports.queryUsers = async ({ } = {}) => {
    try {
        const queryResult = await User.find();
        return queryResult;
    } catch (err) {
        console.error("Error occurred:", err.message);
    }
};

// // get all user 
// const getAllUsers = async () => {
//     try {
//         const users = await User.find();
//         return users;
//     } catch (error) {
//         console.error("Error fetching users:", error);
//         throw error;
//     }
// };

// module.exports = {
//     getAllUsers,
// };

/**
 * Cập nhật thông tin user
 */
exports.queryUser = async (userId, updateData) => {
    try {
        // tìm rồi cập nhật thông tin 
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    } catch (error) {
        console.error("Error updating user:", error.message);
        throw error;
    }
}

