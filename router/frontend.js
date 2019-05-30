let router = require('koa-router')()
let apiModel = require('../mysql/mysqlConfig.js')
let path = require('path')
let koaBody = require('koa-body')
let fs = require('fs')
let moment = require('moment')
let md5 = require('md5')
let checkToken = require('../checkToken/check').checkToken
let jwt = require('jsonwebtoken');
let config = require('../config/default.js')
const qiniuFunc=require('../config/qiniuConfig.js')

//前端注册
router.post('/movie/signup', koaBody(), async (ctx, next) => {
	let {
		userName,
		password
	} = ctx.request.body
	await apiModel.findUserByName(userName)
		.then(async res => {
			console.log('注册用户信息', res)
			if (res.length > 0) {
				ctx.body = {
					code: 500,
					message: '该用户名已注册'
				}
				return
			}
			await apiModel.addUser([userName, password, moment().format('YYYY-MM-DD')])
				.then((res) => {
					ctx.body = {
						code: 200,
						message: '注册成功'
					}
				})
		}).catch((error) => {
			ctx.body = {
				code: 400,
				message: '注册失败',
				error: error
			}
		})
})

// 前端登录
router.post('/movie/signin', koaBody(), async (ctx, next) => {
	let {
		userName,
		password
	} = ctx.request.body
	let token = jwt.sign({
		userName: userName
	}, config.jwt_secret, {
		expiresIn: '30 days'
	})
	await apiModel.findUserByName(userName).then(res => {
    if (res.length < 1) {
      ctx.body = {
        code: 300,
        message: '该用户没有注册',
      }
      return
    }
    if (res[0]['userName'] === userName && res[0]['password'] === password) {
      ctx.body = {
        code: 200,
        data: res[0],
        token: token,
        message: '登录成功'
      }
    } else {
      ctx.body = {
        code: 500,
        message: '用户名或密码错误'
      }
    }
  }).catch((error) => {
    ctx.body = {
      code: 400,
      message: '登录错误',
      error: error
    }
  })
})

// 验证码
router.get('/movie/verifycode', async (ctx, next) => {
	const captcha = require('trek-captcha')
	const {
		token,
		buffer
	} = await captcha({
		size: 4
	})
	await new Promise((reslove, reject) => {
		fs.createWriteStream('./public/images/yzm.jpg').on('finish', () => {
			reslove(true)
		}).end(buffer)
  }).then((res)=>{
    ctx.body = {
			code: 200,
			data: token,
			message: '获取验证码成功'
		}
  }).catch((error)=>{
    ctx.body = {
			code: 400,
			data: error,
			message: '获取验证码失败'
		}
  })
})

// 获取分类列表的数据
router.get('/movie/allmovie', async (ctx, next) => {
	// console.log('header token',console.log(ctx.request.headers))
	await Promise.all([
		apiModel.findDataByClassify('电影'),
		apiModel.findDataByClassify('电视剧'),
		apiModel.findDataByClassify('综艺'),
		apiModel.findDataByClassify('动漫'),
		apiModel.findData('movies')
	]).then(res => {
		ctx.body = {
			code: 200,
			data: res,
			message: '获取数据成功'
		}
	}).catch(err => {
		ctx.body = {
			code: 500,
			message: '获取数据失败',
			err
		}
	})
})

// 搜索
router.post('/movie/search', koaBody(), async (ctx) => {
	let value = ctx.request.body.value
  await apiModel.search(value).then(res => {
		ctx.body = {
			code: 200,
			data: res,
			message: '搜索成功',
			total: res.length
		}
	})
})

// 获取单个movie的信息
router.post('/movie/getMovieById', koaBody(), async (ctx) => {
	let id = ctx.request.body.movieId
	await apiModel.getDataByMovieId(id).then(res => {
    if (res.length < 1) {
      ctx.body = {
        code: 400,
        message: '数据不存在'
      }
      return
    }
    ctx.body = {
      code: 200,
      data: res,
      message: '获取详情成功'
    }
  }).catch(err => {
    ctx.body = {
      code: 500,
      message: '获取详情失败',
      err
    }
  })
})

// 获取分类列表的数据
router.post('/movie/classifymovie', koaBody(), async (ctx, next) => {
  let classifyName=ctx.request.body.classifyName
  let token = ctx.get('Authorization')
  // console.log('token: '+ token)
  jwt.verify(token, config.jwt_secret, (err, decoded) => {
    console.log('movie tv show')
    console.log(decoded)
  })
  await apiModel.findDataByClassify(classifyName).then(res => {
		ctx.body = {
			code: 200,
			data: res,
			message: '获取数据成功'
		}
	}).catch(err => {
    console.log(err)
		ctx.body = {
			code: 500,
			message: '获取数据失败',
			err
		}
	})
})
// 获取分类列表中的全部的数据
router.post('/movie/classifyall', koaBody(),async (ctx, next) => {
  let table=ctx.request.body.table
  let token = ctx.get('Authorization')
  // console.log('token: '+ token)
  jwt.verify(token, config.jwt_secret, (err, decoded) => {
    console.log('all')
    console.log(decoded)
  })
	await apiModel.findData(table).then(res => {
		ctx.body = {
			code: 200,
			data: res,
			message: '获取数据成功'
		}
	}).catch(err => {
    console.log(err)
		ctx.body = {
			code: 500,
			message: '获取数据失败',
			err
		}
	})
})

// 上传头像
router.post('/movie/uploadavatar', koaBody({
	"formLimit": "5mb",
	"jsonLimit": "5mb",
	"textLimit": "5mb"
}), async (ctx) => {
	let {
		userName,
		avatar
	} = ctx.request.body
	let base64Data = avatar.replace(/^data:image\/\w+;base64,/, "")
	let dataBuffer = new Buffer.from(base64Data, 'base64');
	let setImageName = 'avatar'+Number(Math.random().toString().substr(3)).toString(36)+Date.now()
	await checkToken(ctx).then(async res => {
    await apiModel.findUserByName(userName).then(async (res)=>{
      let oldAvatar=res[0].avatar
      let localFile = path.resolve(__dirname, '../public/images/avatar/')+ '/' + setImageName + '.png'
      let key=`${setImageName}.png`
      let imageUrl=`http://qiniua.qifei.site/${key}`      
      await Promise.all([
        apiModel.updateUserAvatar([imageUrl, userName]),
        apiModel.updateCommentAvatar([imageUrl, userName])
      ]).then(res => {
        console.log('上传成功')
        ctx.body = {
          code: 200,
          avatar: imageUrl,
          message: '上传成功'
        }
      })
      if(res.length>0 && res[0].avatar){        
        // 删除七牛原图片
        let deleteKey= oldAvatar.split('http://qiniua.qifei.site/')[1]
        qiniuFunc.deleteQiniuFile(deleteKey)
      }
      await fs.writeFile('./public/images/avatar/' + setImageName + '.png', dataBuffer, async (err) => { 
        if (err) {
          console.log('upload png:')
          console.log(err)
        }else{
          // 上传到七牛
          await qiniuFunc.uploadToQiniu(localFile,key).then(async (res)=>{        
            //删除写入到本地的图片
            fs.unlink(localFile, function(err) {
              if (err) throw err
              console.log('文件删除成功')
            })  
          })
        }
      })
    })
  }).catch(err => {
		console.log(err)
		ctx.body = {
      code: 500,
      message: '上传失败',
      err
    }
	})
})

// 修改用户名
router.post('/movie/edituserinfo', koaBody(), async (ctx, next) => {
	console.log('ctx.request.body:',ctx.request.body)
	let newName = ctx.request.body.newName
	let introduction = ctx.request.body.introduction
	let github = ctx.request.body.github
	let blog =  ctx.request.body.blog
	let email =  ctx.request.body.email
	let userName = ctx.request.body.userName
	await checkToken(ctx).then(async res => {
		if(userName===newName){
		  await	apiModel.updateUserInfo([introduction,github,blog,email,userName])
			.then(res=>{
				ctx.body = {
					code: 200,
					message: '用户信息修改成功'
				}
			})
		}else{
			await apiModel.findUserByName(newName).then(async res => {					
				if (res.length > 0) {
					ctx.body = {
						code: 300,
						message: '用户名已注册'
					}
					return
				}
				await Promise.all([
					apiModel.updateUserName([newName,introduction,github,blog,email,userName]),
					apiModel.updateCommentUserName([newName, userName]),
					apiModel.updateScoresUserName([newName, userName]),
					apiModel.updateCollectionsUserName([newName, userName])
				]).then(res => {
					let newToken = jwt.sign({
						userName: newName
					}, config.jwt_secret, {
						expiresIn: '30 days'
					})
					ctx.body = {
						code: 201,
						token: newToken,
						message: '用户信息修改成功'
					}
				})
			})
		}		
	}).catch(err => {
    console.log(err)
		ctx.body = {
			code: 400,
			message: '用户信息修改失败',
			err
		}
	})
})

// 获取用户头像和用户信息
router.post('/movie/getUserInfo', koaBody(), async (ctx) => {
	await apiModel.findUserByName(ctx.request.body.userName)
		.then(res => {
			console.log('获取用户信息',res[0])
			if(res.length>0){
				ctx.body = {
					code: 200,
					data: res[0], //{avatar:res[0].avatar,time:res[0].time},
					message: '获取用户信息成功'
				}
			}else{
				ctx.body = {
					code: 300,
					message: '没有该用户'
				}
			}			
		}).catch(err => {
			ctx.body = {
				code: 400,
				message: '获取用户信息失败',
				err
			}
		})
})

// 评论
router.post('/movie/postComment', koaBody(), async (ctx) => {
	let {
		userName,
		content,
		movieName,
		avatar,
		movieId,
		coverimage
	} = ctx.request.body
	let date = moment().format('YYYY-MM-DD HH:mm:ss');
	await checkToken(ctx).then(async res => {
		// console.log(res)
		await apiModel.addComment([userName, date, content, movieName, movieId, avatar,coverimage])
			.then(res => {
				// console.log(res)
				ctx.body = {
					code: 200,
					message: '评论成功'
				}
			})
	}).catch(err => {
		console.log(err)
		ctx.body = {
      code: 500,
      message: '评论失败',
      err
    }
	})
})

// 获取影片的评论
router.post('/movie/getMovieComment', koaBody(), async (ctx) => {
	// console.log(ctx.request.body)
	await apiModel.getCommentByMovieId(ctx.request.body.movieId)
		.then(res => {
			ctx.body = {
				code: 200,
				data: res,
				message: '获取评论成功'
			}
		}).catch(err => {
			ctx.body = {
				code: 500,
        message: '获取评论失败',
        err
			}
		})
})

// 获取用户的评论
router.post('/movie/getUserComment', koaBody(), async (ctx) => {
	await apiModel.getCommentByUser(ctx.request.body.userName)
		.then(res => {
			ctx.body = {
				code: 200,
				data: res,
				message: '获取用户的评论成功'
			}
		}).catch(err => {
			ctx.body = {
				code: 500,
				message: '获取用户的评论失败'
			}
		})
})

// 获取用户的评论
router.post('/movie/deletecomment', koaBody(), async (ctx) => {
	await apiModel.deleteComment(ctx.request.body.commentId)
		.then(res => {
			ctx.body = {
				code: 200,
				message: '删除评论成功'
			}
		}).catch(err => {
			ctx.body = {
				code: 500,
				message: '删除评论失败',
				err
			}
		})
})

// 保存评价分数
router.post('/movie/savescore', koaBody(), async (ctx) => {
	console.log('------保存评价分数--------')
	console.log(ctx.request.body)
	console.log('------保存评价分数--------')
	let {
		userName,
		movieName,
		coverimage,
		score,
		movieId
	} = ctx.request.body
	await checkToken(ctx).then(async (res) => {
		await apiModel.searchScoreByMovieId(movieId, userName).then(async (res) => {
			if (res.length > 0) {
				await apiModel.updateScore(score, movieId, userName).then((res) => {
					ctx.body = {
						code: 200,
						message: '更新成功'
					}
				})
			} else {
				await apiModel.saveScore([userName, movieName, coverimage, score, movieId]).then((res) => {
					ctx.body = {
						code: 200,
						message: '保存成功'
					}
				})
			}
		})
	}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '保存评价失败',
			error
		}
	})
})

// 获取评价
router.post('/movie/getscore', koaBody(), async (ctx) => {
	// console.log('------huoqu评价分数--------')
	// console.log(ctx.request.body)
	// console.log('------huoqu评价分数--------')
	let {
		movieId,
		userName
	} = ctx.request.body
	// console.log('userName: '+userName)
	await checkToken(ctx).then(async (res)=>{
		await apiModel.searchScoreByMovieId(movieId, userName).then((res) => {
			// console.log(res)
			if (res.length > 0) {
				ctx.body = {
					code: 200,
					data: res[0],
					message: '获取用户评价'
				}
			} else {
				ctx.body = {
					code: 201,
					data: res,
					message: '还没有评价'
				}
			}
		})
	}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '获取评价失败',
			error
		}
	})
})

//获取单个movie所有评价
router.post('/movie/getsinglescore', koaBody(), async (ctx) => {
	let movieId = ctx.request.body.movieId
	await apiModel.getSingleMovieScore(movieId).then((res) => {
		// console.log(res)
		if (res.length > 0) {
			ctx.body = {
				code: 200,
				data: res,
				message: '获取评价成功'
			}
		} else {
			ctx.body = {
				code: 201,
				data: res,
				message: '还没有评价'
			}
		}
	}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '获取评价失败',
			error
		}
	})	
})

//保存平均分数到movies表中
router.post('/movie/savescoretomovies', koaBody(), async (ctx) => {
	let {meanScore,movieId} = ctx.request.body
	// console.log('movieId: ' + movieId)
		if(!meanScore){
			meanScore=0
		}
		await apiModel.saveScoreToMovies(meanScore,movieId).then((res) => {
			// console.log(res)
			ctx.body = {
				code: 200,
				message: '保存平均评价成功'
			}
		}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '保存平均评价失败',
			error
		}
	})
})

//删除评价
router.post('/movie/deleteuserscore', koaBody(), async (ctx) => {
	let {userName,movieId} = ctx.request.body
	// console.log(ctx.request.body)
	await checkToken(ctx).then(async (res)=>{
		await apiModel.deleteEvaluateScore(userName,movieId).then((res) => {
			console.log(res)
			ctx.body = {
				code: 200,
				message: '删除评价成功'
			}
		})
	}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '删除评价失败',
			error
		}
	})
})

//保存收藏表中 increaseCollectionNum reduceCollectionNum
router.post('/movie/savecollection', koaBody(), async (ctx) => {
	// console.log('collection: ', ctx.request.body)
	let {userName,movieName,coverimage,movieid} = ctx.request.body
	await checkToken(ctx).then(async (res)=>{
		await apiModel.findCollection(userName,movieid).then(async (res)=>{
			// console.log('findCollection: ',res.length)
			if(res.length>0){
				await apiModel.reduceCollectionNum(movieid).then((res)=>{ctx.body=true})
				await apiModel.deleteCollection(userName,movieid).then((res)=>{
					console.log(res)
					ctx.body={
						code: 200,
						message: '取消收藏成功'
					}
				})
			}else{
				await apiModel.increaseCollectionNum(movieid).then((res)=>{ctx.body=true})
				await apiModel.saveCollection([userName,movieName,coverimage,movieid]).then((res) => {
					console.log(res)
					ctx.body = {
						code: 200,
						message: '收藏成功'
					}
				})
			}
		})
	}).catch((error)=>{
		console.log(error)
		ctx.body = {
			code: 404,
			message: '保存收藏失败',
			error
		}
	})
})

// 获取评价过的movie
router.post('/movie/getuserallscore', koaBody(), async (ctx) => {
	let userName = ctx.request.body.userName
	await apiModel.getMovieScoreByUsername(userName).then((res) => {
		// console.log(res)
		if (res.length > 0) {
			ctx.body = {
				code: 200,
				data: res,
				message: '获取评价过的movie成功'
			}
		} else {
			ctx.body = {
				code: 201,
				data: res,
				message: '还没有任何评价'
			}
		}
	}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '获取评价失败',
			error
		}
	})	
})
// 获取收藏的movie
router.post('/movie/getusercollection', koaBody(), async (ctx) => {
	let userName = ctx.request.body.userName
	await apiModel.getCollectionByUsername(userName).then((res) => {
		// console.log(res)
		if (res.length > 0) {
			ctx.body = {
				code: 200,
				data: res,
				message: '获取收藏的movie成功'
			}
		} else {
			ctx.body = {
				code: 201,
				data: res,
				message: '还没有任何收藏'
			}
		}
	}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '获取收藏失败',
			error
		}
	})	
})

// 获取收藏的movie
router.post('/movie/getcollectionbyusermovie', koaBody(), async (ctx) => {
	let {userName,movieid} = ctx.request.body
	await apiModel.getCollectionByUsernameMovieid(userName,movieid).then((res) => {
		console.log('getCollectionByUsernameMovieid: ',res)
		if (res.length > 0) {
			ctx.body = {
				code: 200,
				message: res
			}
		} else {
			ctx.body = {
				code: 201,
				message: '还没有任何收藏'
			}
		}
	}).catch((error) => {
		console.log(error)
		ctx.body = {
			code: 404,
			message: '获取收藏失败',
			error
		}
	})	
})

module.exports = router