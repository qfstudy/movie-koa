const jwt = require('jsonwebtoken');
const config = require('../config/default.js')

module.exports = {
	checkLogin:ctx=>{
		if (!ctx.session || !ctx.session.user) {
			ctx.redirect('/signin')
		}
	},
	checkToken:async ctx=>{
		let token = ctx.get('Authorization')
		let {userName} =ctx.request.body
		console.log('userName:', userName,'token:',token)
		return new Promise((reslove,reject)=>{
			jwt.verify(token, config.jwt_secret, (err, decoded) => {
				if(err){
					/*
						err = {
							name: 'TokenExpiredError',
							message: 'jwt expired',
							expiredAt: 1408621000
						}
					*/
					if (err.message === 'jwt expired'){
						reject({
							code: 404,
							message: '用户权限过期'
						})
					}else{
						reject({
							code: 404,
							message: '无效用户权限'
						})
					}
					console.log('token error',err)
				}else{					
					if (userName === decoded.userName){
						console.log('token success', decoded)
						reslove({
							code:200,
							message:'验证成功'
						})
					}else{
						console.log('token error',decoded)
						reject({
							code: 404,
							message: '用户身份不一致'
						})
					}
				}
			})
		})
	}
}