const User = require("../models/User"); // Đường dẫn tới model User của bạn

const resetBannedUsers = async () => {
  try {
    let hasMore = true;

    while (hasMore) {
      const users = await User.find({ bannedUser: true }).limit(50).exec();

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      const userIds = users.map((user) => user._id);

      await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { bannedUser: false } }
      );
    }

    console.log("Đã reset tất cả các user bị banned thành false.");
  } catch (error) {
    console.error("Lỗi khi reset trạng thái bannedUser:", error);
  }
};

cron.schedule("0 0 1 * *", async () => {
  console.log("Chạy job reset bannedUser vào ngày đầu tiên của tháng.");
  await resetBannedUsers();
});
