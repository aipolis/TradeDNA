// 名人头像映射
// 头像图放在 /assets/mentors/ 下,推荐 300x300 圆形/正方形 png 或 jpg
// 漫画或真人风格均可,但 16 张要统一风格
// 没找到映射则前端降级为名字首字圆圈
const MENTOR_AVATARS = {
  '詹姆斯·西蒙斯': '/assets/mentors/simons.jpg',
  '大卫·肖': '/assets/mentors/shaw.jpg',
  '肯·格里芬': '/assets/mentors/griffin.jpg',
  '史蒂夫·科恩': '/assets/mentors/cohen.jpg',
  '雷·达里奥': '/assets/mentors/dalio.jpg',
  '沃伦·巴菲特': '/assets/mentors/buffett.jpg',
  '段永平': '/assets/mentors/duanyongping.jpg',
  '乔治·索罗斯': '/assets/mentors/soros.jpg',
  '保罗·都铎·琼斯': '/assets/mentors/ptj.jpg',
  '赵老哥': '/assets/mentors/zhaolaoge.jpg',
  '章建平': '/assets/mentors/zhangjianping.jpg',
  '杰西·利弗莫尔': '/assets/mentors/livermore.jpg',
  '约翰·博格': '/assets/mentors/bogle.jpg',
  '但斌': '/assets/mentors/danbin.jpg',
  '张磊': '/assets/mentors/zhanglei.jpg',
  '凯西·伍德': '/assets/mentors/wood.jpg'
}

function getMentorAvatar(name){
  return MENTOR_AVATARS[name] || ''
}

module.exports = { getMentorAvatar, MENTOR_AVATARS }
