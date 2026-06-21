const ROUTE = {
  index: '/pages/index/index',
  intro: '/pages/intro/intro',
  mine:  '/pages/mine/mine'
}
Component({
  properties:{ active:{ type:String, value:'index' } },
  methods:{
    go(e){
      const key = e.currentTarget.dataset.key
      if(key === this.data.active) return
      const url = ROUTE[key]
      if(!url) return
      wx.reLaunch({ url })
    }
  }
})
