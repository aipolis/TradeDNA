const { officialAccount } = require('../config/brand')

function openOfficialAccount(){
  const { name, username } = officialAccount
  if(!username){
    wx.showModal({
      title: '关注公众号',
      content: `长按下方二维码识别，关注「${name}」`,
      showCancel: false,
      confirmText: '知道了'
    })
    return Promise.reject(new Error('official username not configured'))
  }
  return new Promise((resolve, reject)=>{
    wx.openOfficialAccountProfile({
      username,
      success: resolve,
      fail: err => {
        console.warn('[follow] openOfficialAccountProfile fail', err)
        wx.showModal({
          title: '暂时无法直接跳转',
          content: `请长按二维码识别，或搜索「${name}」关注`,
          showCancel: false,
          confirmText: '知道了'
        })
        reject(err)
      }
    })
  })
}

module.exports = { openOfficialAccount }
