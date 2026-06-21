/**
 * 题目乱序工具
 * - 同一维度内的题目顺序打乱(用户能看到维度 pill,但无法从位置推断哪个选项加什么分)
 * - 每题的 A/B 选项顺序也打乱(避免位置偏好)
 * - 行为题(behavior)整体保留在末尾
 */

function fisherYates(arr){
  const a = arr.slice()
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1))
    ;[a[i],a[j]] = [a[j],a[i]]
  }
  return a
}

function shuffleQuestions(questions){
  const mainOrder = ['decision','cycle','risk','execution']
  const groups = {}
  const behaviorGroup = []
  questions.forEach(q=>{
    if(q.dimension === 'behavior'){ behaviorGroup.push(q); return }
    if(!groups[q.dimension]) groups[q.dimension] = []
    groups[q.dimension].push(q)
  })
  const mainQs = []
  mainOrder.forEach(dim=>{
    if(groups[dim]) fisherYates(groups[dim]).forEach(q=>mainQs.push(q))
  })
  const behaviorQs = fisherYates(behaviorGroup)
  // 注意：选项顺序保持不变(选项展示统一为 A/B,无方向性偏好)
  return [...mainQs, ...behaviorQs]
}

module.exports = { shuffleQuestions, fisherYates }
