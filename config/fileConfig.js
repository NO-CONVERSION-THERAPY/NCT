const { resolveProjectPath } = require('./runtimeConfig')

const paths = {
    views: resolveProjectPath('views'),
    public: resolveProjectPath('public'),
    blogData: resolveProjectPath('data.json'),
    blog: resolveProjectPath('blog'),
    friendsData: resolveProjectPath('friends.json')
}
module.exports = {
    paths
}
