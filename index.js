const Koa = require('koa')
const path = require('path')
const ejs = require('ejs')
const session = require('koa-session-minimal')
const MysqlStore = require('koa-mysql-session')
const config = require('./config/default.js')
const views = require('koa-views')
const compress = require('koa-compress')
const logger = require('koa-logger')
const static = require('koa-static')
const cors = require('koa2-cors')
const router = require('koa-router')
var route = new router()
const app = new Koa()

const sessionMysqlConfig = {
	user:config.database.USER,
	password:config.database.PASSWORD,
	host:config.database.HOST,
	database:config.database.DATABASE
}
app.use(logger())
app.use(cors({
	allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))
app.use(session({
	key:'ADMIN_USER',
	store:new MysqlStore(sessionMysqlConfig)
}))
app.use(async (ctx, next) => {
  if (ctx.method === 'OPTIONS') {
    console.log('ctx.method: '+ctx.method)
    ctx.body = ''
  }
  await next()
})

// 静态资源目录路径
app.use(static(
  path.join(__dirname, './public')
))

app.use(views(path.join(__dirname,'./views'),{
	extension: 'ejs'
}))
app.use(compress({threshold: 2048}))
app.use(require('./router/admin.js').routes()).use(route.allowedMethods())
app.use(require('./router/frontend.js').routes()).use(route.allowedMethods())


app.listen(3002)

console.log('listen in 3002')
