// 名人头像映射 V3
// 头像图放在 /assets/mentors/ 下，推荐 300×300 JPG（quality ~88）
// 没找到映射则前端降级为名字首字圆圈
// V3 新增 ~30 位导师，头像可后续补充，暂时降级为首字圈
const MENTOR_AVATARS = {
  // RTCD
  '詹姆斯·西蒙斯': '/assets/mentors/simons.jpg',
  '大卫·肖': '/assets/mentors/shaw.jpg',
  '邓晓峰': '/assets/mentors/dengxiaofeng.jpg',
  // RTCF
  '沃伦·巴菲特': '/assets/mentors/buffett.jpg',
  '查理·芒格': '/assets/mentors/munger.jpg',
  '段永平': '/assets/mentors/duanyongping.jpg',
  // RTGD
  '肯·格里芬': '/assets/mentors/griffin.jpg',
  '王琛': '/assets/mentors/wangchen.jpg',
  '王亚伟': '/assets/mentors/wangyawei.jpg',
  '冯成毅': '/assets/mentors/fengchengyi.jpg',
  // RTGF
  '史蒂夫·科恩': '/assets/mentors/cohen.jpg',
  '邱国鹭': '/assets/mentors/qiuguolu.jpg',
  '管大宇': '/assets/mentors/guandayu.jpg',
  // RECD
  '雷·达里奥': '/assets/mentors/dalio.jpg',
  '霍华德·马克斯': '/assets/mentors/marks.jpg',
  '青泽': '/assets/mentors/qingze.jpg',
  '谢治宇': '/assets/mentors/xiezhiyu.jpg',
  // RECF
  '张坤': '/assets/mentors/zhangkun.jpg',
  // REGF
  '乔治·索罗斯': '/assets/mentors/soros.jpg',
  '但斌': '/assets/mentors/danbin.jpg',
  '张磊': '/assets/mentors/zhanglei.jpg',
  // XTCD
  '约翰·博格': '/assets/mentors/bogle.jpg',
  // XTGD
  '凯西·伍德': '/assets/mentors/wood.jpg',
  // XECD / XEGF（早期 / 晚期 都指向同一张图）
  '杰西·利弗莫尔（早期）': '/assets/mentors/livermore.jpg',
  '杰西·利弗莫尔（晚期）': '/assets/mentors/livermore.jpg',
  // XEGD
  '章建平': '/assets/mentors/zhangjianping.jpg',
  '赵老哥': '/assets/mentors/zhaolaoge.jpg'
}

function getMentorAvatar(name){
  return MENTOR_AVATARS[name] || ''
}

module.exports = { getMentorAvatar, MENTOR_AVATARS }
