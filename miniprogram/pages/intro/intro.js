const { isProfileReady } = require('../../utils/auth')
const { getProfile } = require('../../utils/userProfile')

Page({
  go(){
    const target = '/pages/quiz/quiz'
    if(isProfileReady(getProfile())){
      wx.navigateTo({ url: target })
      return
    }
    wx.navigateTo({ url: `/pages/login/login?redirect=${encodeURIComponent(target)}` })
  }
})
