const User = require("../models/User");


/**
 * Function to get a user by a specific filter (like userId, googleId, etc.)
 * @param {Object} filter - The filter criteria (e.g., { userId }, { googleId })
 * @param {String} userId - ID user cần cập nhật
 * @param {Object} updateData 
 * @returns {Object} - trả về đối tượng user hoặc null nếu ko thấy
 * @returns {Array} - trả về mảng users object
 */

const getUser = async (filter) => {
    try {
        const user = await User.findOne(filter);
        if (!user) {
            return { success: false, message: "User not found" };
        }
        return { success: true, data: user };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const getAllUsers = async () => {
    try {
        const users = await User.find({}); // Fetch all users
        return { success: true, data: users };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const updateUser = async (userId, updateData) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData }, // Set new values
            { new: true, runValidators: true } // Return the updated document and apply validators
        );

        if (!updatedUser) {
            return { success: false, message: 'User not found' };
        }

        return { success: true, data: updatedUser };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

module.exports = {
    getUser,
    getAllUsers,
    updateUser
};


