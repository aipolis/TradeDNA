const { questions: rawQuestions } = require('../../utils/questions')
const { shuffleQuestions } = require('../../utils/shuffle')
const { calculateResult } = require('../../utils/scoring')

const dimensionMap = {
  decision:'决策方式', cycle:'交易周期', risk:'风险偏好',
  execution:'执行能力', behavior:'行为情境'
}
const PROGRESS_KEY = 'tradeDNAProgress'
const PROGRESS_TTL = 7 * 24 * 60 * 60 * 1000 // 7 天

Page({
  data:{
    questions:[], total:0, currentIndex:0, answers:[], timings:[],
    question:null, progress:0, dimensionText:''
  },

  onLoad(){
    const { isProfileReady } = require('../../utils/auth')
    const { getProfile } = require('../../utils/userProfile')
    if(!isProfileReady(getProfile())){
      wx.redirectTo({ url:`/pages/login/login?redirect=${encodeURIComponent('/pages/quiz/quiz')}` })
      return
    }

    const saved = wx.getStorageSync(PROGRESS_KEY)
    if(saved && saved.questions && saved.questions.length === rawQuestions.length
       && (Date.now() - (saved.timestamp||0)) < PROGRESS_TTL
       && saved.answers && saved.answers.some(a=>a!==undefined && a!==null)){
      wx.showModal({
        title:'继续上次测评？',
        content:`你上次答到第 ${saved.currentIndex + 1} 题`,
        confirmText:'继续',
        cancelText:'重新开始',
        success:res=>{
          if(res.confirm){
            this.setData({
              questions: saved.questions,
              total: saved.questions.length,
              currentIndex: saved.currentIndex,
              answers: saved.answers,
              timings: saved.timings || []
            })
            this.update()
          } else {
            this.startFresh()
          }
        }
      })
    } else {
      this.startFresh()
    }
  },

  startFresh(){
    const shuffled = shuffleQuestions(rawQuestions)
    this.setData({
      questions: shuffled,
      total: shuffled.length,
      currentIndex: 0,
      answers: [],
      timings: []
    })
    wx.removeStorageSync(PROGRESS_KEY)
    this.update()
  },

  update(){
    const i = this.data.currentIndex
    const q = this.data.questions[i]
    this._questionShownAt = Date.now()
    this.setData({
      question: q,
      progress: Math.round((i+1)/this.data.questions.length*100),
      dimensionText: dimensionMap[q.dimension] || '测评'
    })
  },

  saveProgress(){
    wx.setStorageSync(PROGRESS_KEY, {
      questions: this.data.questions,
      answers: this.data.answers,
      timings: this.data.timings,
      currentIndex: this.data.currentIndex,
      timestamp: Date.now()
    })
  },

  select(e){
    const idx = e.currentTarget.dataset.index
    const i = this.data.currentIndex
    const answers = this.data.answers
    const timings = this.data.timings
    answers[i] = idx
    if(this._questionShownAt){
      const dt = Date.now() - this._questionShownAt
      // 只在首次回答时记录(避免改答案污染统计)
      if(timings[i] === undefined || timings[i] === null) timings[i] = dt
    }
    this.setData({ answers, timings })
    this.saveProgress()
  },

  prev(){
    if(this.data.currentIndex > 0){
      this.setData({ currentIndex: this.data.currentIndex - 1 })
      this.update()
      this.saveProgress()
    }
  },

  next(){
    const i = this.data.currentIndex
    if(this.data.answers[i] === undefined || this.data.answers[i] === null){
      wx.showToast({ title:'请选择一个选项', icon:'none' })
      return
    }
    if(i >= this.data.questions.length - 1){
      const result = calculateResult(this.data.answers, this.data.questions, this.data.timings)

      // 写入历史
      const history = wx.getStorageSync('tradeDNAHistory') || []
      history.unshift({
        code: result.code,
        cognitiveCode: result.cognitiveCode,
        behaviorCode: result.behaviorCode,
        name: result.personality.name,
        timestamp: result.timestamp
      })
      wx.setStorageSync('tradeDNAHistory', history.slice(0, 20))

      wx.setStorageSync('tradeDNAResult', result)
      wx.removeStorageSync(PROGRESS_KEY)

      wx.redirectTo({ url:'/pages/result/result' })
      return
    }
    this.setData({ currentIndex: i + 1 })
    this.update()
    this.saveProgress()
  }
})
