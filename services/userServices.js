const User = require("../models/User");
const bcrypt = require('bcrypt');


/**
 * Function to get a user by a specific filter (like userId, googleId, etc.)
 * @param {Object} filter - The filter criteria (e.g., { userId }, { googleId })
 * @param {String} userId - ID user cần cập nhật
 * @param {Object} updateData 
 * @returns {Object} - trả về đối tượng user hoặc null nếu ko thấy
 * @returns {Array} - trả về mảng users object
 */


// Get user
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

// Get All Users
const getAllUsers = async () => {
    try {
        const users = await User.find({}); // Fetch all users
        return { success: true, data: users };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Update User Information
const updateUser = async (userId, updateData) => {
    try {

        let { newPassword,
            displayName,
            birthDay,
            userPhone,
            userImage,
            userAddress } = updateData

        console.log(newPassword)
        // Check if the password is being updated
        if (newPassword) {
            // Generate a salt and hash the password
            console.log(newPassword)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            console.log(hashedPassword)
            newPassword = hashedPassword; // Replace the plain text password with the hashed one

        }


        // Assuming User is a Mongoose model
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                password: newPassword,
                displayName: displayName,
                birthDay: birthDay,
                userPhone: userPhone,
                userImage: userImage,
                userAddress: userAddress
            }, // Set new values
            { new: true, runValidators: true } // Return the updated document and apply validators
        );

        if (!updatedUser) {
            return { success: false, message: 'User not found' };
        }

        return { success: true, data: updatedUser };
    } catch (error) {
        console.log(error)
        return { success: false, message: error.message };
    }
};



module.exports = {
    getUser,
    getAllUsers,
    updateUser
};


