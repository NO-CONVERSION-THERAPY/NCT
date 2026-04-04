const fs = require('fs');
const { paths } = require('../../config/fileConfig');

function getFriendDescriptionKey(name) {
  const normalizedName = String(name || '').trim().toLowerCase();

  if (normalizedName === 'hosinoneko') {
    return 'hosinoneko';
  }

  if (normalizedName === '楠沐雪') {
    return 'nanmuxue';
  }

  if (normalizedName === 'hermaphroditus🎀') {
    return 'hermaphroditus';
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
function readFriendsFromJson() {
  let friendsData = { friends: [] };

  try {
    const rawData = fs.readFileSync(paths.friendsData, 'utf8');
    friendsData = JSON.parse(rawData);
  } catch (error) {
    console.error('讀取友鏈出錯：', error);
  }

  return friendsData.friends;
}

function translateWithFallback(t, key, fallbackValue) {
  if (typeof t !== 'function') {
    return fallbackValue;
  }

  const translatedValue = t(key);
  return translatedValue && translatedValue !== key ? translatedValue : fallbackValue;
}

function localizeFriendDescriptions(friends, t) {
  return friends.map((friend) => {
    const descriptionKey = getFriendDescriptionKey(friend.name);

    if (!descriptionKey) {
      return friend;
    }

    const localizedDescription = translateWithFallback(
      t,
      `about.friendDescriptions.${descriptionKey}`,
      friend.desc || ''
    );
    return {
      ...friend,
      desc: localizedDescription || friend.desc || ''
    };
  });
}

async function loadFriends({ language, t } = {}) {
  return localizeFriendDescriptions(readFriendsFromJson(), t);
}

module.exports = {
  loadFriends
};
