module.exports = {
    // 左上角标题
    title: `liuweidong' blogs`,
    // 描述
    description: ' ',
    // 头部部署，网页小图标
    head: [
        // ico 配置
        ['link', { rel: 'icon', href: '/icon.png' }]
    ],
    themeConfig: {
        nav: require('./nav'),
        sidebar: require('./sidebar/index'),
        // sidebarDepth: 3,
        // lastUpdated: '上次更新'
    }
}