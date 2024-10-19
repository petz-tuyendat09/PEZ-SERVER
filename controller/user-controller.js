const userServices = require("../services/userServices");

// Get user by ID
const getUserById = async (req, res) => {
    const userId = req.params.id;
    const result = await userServices.getUser({ _id: userId });

    if (result.success) {
        res.status(200).json(result.data);
    } else {
        res.status(404).json({ message: result.message });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    const result = await userServices.getAllUsers();

    if (result.success) {
        res.status(200).json(result.data);
    } else {
        res.status(500).json({ message: result.message });
    }
};

// Update user by ID
const updateUserById = async (req, res) => {
    const { userId } = req.body;
    const updateData = req.body;

    const result = await userServices.updateUser(userId, updateData);

    if (result.success) {
        res.status(200).json(result.data);
    } else {
        res.status(404).json({ message: result.message });
    }
};

module.exports = {
    getUserById,
    getAllUsers,
    updateUserById
};
