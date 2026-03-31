const fs = require('fs');
const path = require('path');

function getFriendDescriptionKey(name) {
  const normalizedName = String(name || '').trim().toLowerCase();

  if (normalizedName === 'hosinoneko') {
    return 'hosinoneko';
  }

  if (normalizedName === '牧鸢') {
    return 'muyuan';
  }

  if (normalizedName === 'amber') {
    return 'amber';
  }

  return null;
}

// about 页面用到的友链数据目前仍保存在本地 JSON 文件中。
function loadFriends(t) {
  let friendsData = { friends: [] };

  try {
    const jsonPath = path.join(__dirname, '../../friends.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    friendsData = JSON.parse(rawData);
  } catch (error) {
    console.error('讀取友鏈出錯：', error);
  }

  return friendsData.friends.map((friend) => {
    const descriptionKey = getFriendDescriptionKey(friend.name);

    if (!descriptionKey || typeof t !== 'function') {
      return friend;
    }

    const localizedDescription = t(`about.friendDescriptions.${descriptionKey}`);
    return {
      ...friend,
      desc: localizedDescription || friend.desc || ''
    };
  });
}

module.exports = {
  loadFriends
};
