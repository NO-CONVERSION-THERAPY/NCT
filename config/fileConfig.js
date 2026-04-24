const { resolveProjectPath } = require('./runtimeConfig')

// 所有静态目录和数据文件路径都统一走这里，
// 这样 Node 与 Workers 两种运行时都能共享同一套相对路径定义。
const paths = {
    views: resolveProjectPath('views'),
    public: resolveProjectPath('public'),
    reactBuild: resolveProjectPath('public/react-app'),
    blogData: resolveProjectPath('data.json'),
    blog: resolveProjectPath('blog'),
    friendsData: resolveProjectPath('friends.json')
}
module.exports = {
    paths
}
