var router = require('koa-router')()
var apiModel = require('../mysql/mysqlConfig.js')
var path = require('path')
var koaBody = require('koa-body')
var checkLogin = require('../checkToken/check.js').checkLogin
var fs = require('fs')
const qiniuFunc=require('../config/qiniuConfig.js')

router.get('/', async (ctx, next) => {
	let page
	let dataLength = ''
	if (ctx.querystring === '') {
		page = 1
	} else {
		page = ctx.querystring.split('=')[1];
	}
	await checkLogin(ctx)
	await apiModel.findData('movies').then(res => {
		dataLength = res.length
	})
	await apiModel.findPageData('movies', page, 7).then(res => {
		data = JSON.parse(JSON.stringify(res))
	})
	await ctx.render('list', {
		movies: data,
		session: ctx.session,
		dataLength: Math.ceil(dataLength / 7),
		nowPage: parseInt(page)
	})
})
// 获取登录页面
router.get('/signin', async (ctx, next) => {
	if (ctx.session.user) {
		await ctx.redirect('/')
	} else {
		await ctx.render('signin')
	}
})
// 登录 post
router.post('/signin', koaBody(), async (ctx, next) => {
	var {
		userName,
		password
	} = ctx.request.body
	await apiModel.findAdminUser(userName)
		.then(res => {
			// console.log(res,res[0].username)
			if (res[0]['username'] === userName) {
				ctx.session.user = userName
				ctx.session.pass = password
				ctx.redirect('/')
			}
		}).catch(() => {
			ctx.session.user = userName
			ctx.session.pass = password
			apiModel.addAdminUser([userName, password])
			ctx.redirect('/')
		})
})
// 登出
router.get('/signout', async (ctx, next) => {
	ctx.session = null
	await ctx.redirect('/')
})

// 上传movie数据
router.get('/upload', async (ctx, next) => {
	await checkLogin(ctx)
	await ctx.render('upload', {
		session: ctx.session
	})
})
// 上传movie数据 post
router.post('/upload', koaBody({
	multipart: true,
	"formLimit": "5mb",
	"jsonLimit": "5mb",
	"textLimit": "5mb"
}), async (ctx, next) => {
	let movieData = Object.assign({}, ctx.request.body)
	let {
		movieName,
		movieCountry,
		movieClassify,
		movieTime,
		coverImage,
		movieLength,
		movieType,
		movieDirector,
		movieActors,
		movieBrief,
		movieLanguage
	} = movieData

	let base64Data = coverImage.replace(/^data:image\/\w+;base64,/, "")
	let dataBuffer = Buffer.from(base64Data, 'base64') 
	let setImageName = Number(Math.random().toString().substr(3)).toString(36) + Date.now()

	let localFile = path.resolve(__dirname, '../public/images/')+ '/' + setImageName + '.png'
	let key=`${setImageName}.png`
	let coverImageUrl = `http://qiniua.qifei.site/${key}`
	let data = [
		movieName, 
		movieCountry, 
		movieClassify, 
		movieTime,
		coverImageUrl, 
		movieLength, 
		movieType,
		movieDirector, 
		movieActors, 
		movieBrief, 
		movieLanguage
	]
	await apiModel.insertData(data).then((res) => {
		ctx.body = {
			code: 200,
			message: '上传成功'
		}
	}).catch(res => {
		ctx.body = {
			code: 500,
			message: '上传失败',
		}
		console.log(res)
	})
	await fs.writeFile('./public/images/' + setImageName + '.png', dataBuffer, async (err) => { 
		if (err) {
			console.log('upload png:')
			console.log(err)
		}else{
			//上传到七牛
			await qiniuFunc.uploadToQiniu(localFile,key).then(async (res)=>{
				//删除写入到本地的图片
				fs.unlink(localFile, function(err) {
					if (err) throw err
					console.log('文件删除成功')
				})				
			}).catch(res => {
				ctx.body = {
					code: 500,
					message: '上传失败',
				}
				console.log(res)
			})
		}
	})
})
// 编辑页面
router.get('/edit/:id', async (ctx, next) => {
	console.log('params.id', ctx.params.id)
	await apiModel.findDataById(ctx.params.id).then(async res => {
    data = JSON.parse(JSON.stringify(res))
    await ctx.render('edit', {
      movie: data[0],
      session: ctx.session
    })
  })
})
// 编辑 post
router.post('/edit/:id', koaBody({
	multipart: true,
	"formLimit": "5mb",
	"jsonLimit": "5mb",
	"textLimit": "5mb"
}), async (ctx, next) => {
	let movieData = Object.assign({}, ctx.request.body)
	let {
		movieName,
		movieCountry,
		movieClassify,
		movieTime,
		coverImage,
		movieLength,
		movieType,
		movieDirector,
		movieActors,
		movieBrief,
		movieLanguage,
		newCoverImage
	} = movieData
	// console.log('coverImageUrl+++++'+coverImage)
	let coverImageUrl
	if(newCoverImage){
		let base64Data = newCoverImage.replace(/^data:image\/\w+;base64,/, "")
		let dataBuffer = Buffer.from(base64Data, 'base64') 
		let setImageName = Number(Math.random().toString().substr(3)).toString(36) + Date.now()
		let localFile = path.resolve(__dirname, '../public/images/')+ '/' + setImageName + '.png'
		let key=`${setImageName}.png`
		await fs.writeFile('./public/images/' + setImageName + '.png', dataBuffer, async(err) => { 
			if (err) {
				console.log('upload png:')
				console.log(err)
			}else{				
				//上传到七牛
				await qiniuFunc.uploadToQiniu(localFile,key).then(async (res)=>{					
					//删除写入到本地的图片
					fs.unlink(localFile, function(err) {
						if (err) throw err
						console.log('文件删除成功')
					})
					// 删除七牛原图片
					let deleteKey= coverImage.split('http://qiniua.qifei.site/')[1]
					// console.log('deleteKey: '+deleteKey)
					await qiniuFunc.deleteQiniuFile(deleteKey)
					coverImageUrl = `http://qiniua.qifei.site/${key}`
				}).catch(e => {
					console.log(e)
					ctx.body = {
						code: 500,
						message: '修改失败'
					}
				})
			}
		})	
	}else{
		coverImageUrl=coverImage
	}
	
	let data = [
		movieName, 
		movieCountry, 
		movieClassify, 
		movieTime,
		coverImageUrl, 
		movieLength, 
		movieType,
		movieDirector, 
		movieActors, 
		movieBrief, 
		movieLanguage,
		ctx.params.id
	]
	await apiModel.updateMovieData(data).then((res) => {
    console.log('修改成功')
    ctx.body = {
      code: 200,
      message: '修改成功'
    }
  }).catch(e => {
    console.log(e)
    ctx.body = {
      code: 500,
      message: '修改失败'
    }
  })

})
// 删除
router.post('/delete/:id', koaBody(), async (ctx, next) => {
	await apiModel.deleteMovie(ctx.params.id).then(() => {
    ctx.body = 'success'
  }).catch((err) => {
    console.log(err)
  })
})


module.exports = router