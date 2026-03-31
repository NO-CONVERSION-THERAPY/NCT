const fs = require('fs');
const path = require('path');

// about 页面用到的友链数据目前仍保存在本地 JSON 文件中。
function loadFriends() {
  let friendsData = { friends: [] };

  try {
    const jsonPath = path.join(__dirname, '../../friends.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    friendsData = JSON.parse(rawData);
  } catch (error) {
    console.error('讀取友鏈出錯：', error);
  }

  return friendsData.friends;
}

module.exports = {
  loadFriends
};
