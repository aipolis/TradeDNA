const brand = require('./config/brand')

if (wx.cloud) {
  wx.cloud.init({ traceUser: true })
}

App({
  globalData: {
    brand: 'TradeDNA',
    slogan: '发现交易基因 · 找到最适合你的交易体系',
    officialAccount: brand.officialAccount
  }
})
