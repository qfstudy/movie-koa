var mysql = require('mysql');
var config = require('../config/default.js')

var pool = mysql.createPool({
	host:config.database.HOST,
	user:config.database.USER,
	password:config.database.PASSWORD,
	database:config.database.DATABASE,
})

var query = (sql,val) => {
	return new Promise((resolve,reject)=>{
		pool.getConnection((err,connection)=>{
			if (err){
				return resolve(err)
			} else{
				connection.query(sql,val,(err,rows)=>{
					if (err) {
						reject(err)
					}else{
						resolve(rows)
					}
					connection.release()
				})
			}
		})
	})
}

let movies =`
  create table if not exists movies(
    id INT NOT NULL AUTO_INCREMENT,
    moviename VARCHAR(100) NOT NULL COMMENT '影片名称',
    country VARCHAR(50) NOT NULL COMMENT '国家',
    classification VARCHAR(50) NOT NULL COMMENT '分类',
    date VARCHAR(20) NOT NULL COMMENT '上映日期',
    coverimage VARCHAR(100) NOT NULL COMMENT '影片封面图片',
    length VARCHAR(30) NOT NULL COMMENT '影片时长',
    type VARCHAR(50) NOT NULL COMMENT '影视类型',
    director VARCHAR(50) NOT NULL COMMENT '导演',
    actors VARCHAR(100) NOT NULL COMMENT '主演',
    brief VARCHAR(2000) NOT NULL COMMENT '简介',
    language VARCHAR(20) NOT NULL COMMENT '语言',
    scores VARCHAR(100) NOT NULL DEFAULT '0' COMMENT '评价分数',
    collection INT(100) UNSIGNED NOT NULL DEFAULT '0' COMMENT '收藏数',
    PRIMARY KEY ( id )
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;`
  // alter table movies add column collection INT(100) UNSIGNED NOT NULL DEFAULT '0'
  //alter table movies drop column collection; 
  // ALTER  TABLE 表名 MODIFY COLUMN 字段名 新数据类型 新类型长度  新默认值  新注释; 
  // alter table movies modify column collection int(100) UNSIGNED NOT NULL DEFAULT '0' COMMENT '收藏数';
let adminusers =`
  create table if not exists adminusers(
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(50) NOT NULL COMMENT '密码',
    PRIMARY KEY ( id )
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;`
let users =`
  create table if not exists users(
    id INT NOT NULL AUTO_INCREMENT,
    userName VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(50) NOT NULL COMMENT '密码',
    avatar VARCHAR(100) NOT NULL DEFAULT '' COMMENT '头像',
    time VARCHAR(20) NOT NULL DEFAULT '' COMMENT '注册时间',
    introduction VARCHAR(1000) DEFAULT '' COMMENT '个人简介',
    github VARCHAR(100) COMMENT 'github网址',
    blog VARCHAR(100) COMMENT '博客网址',
    email VARCHAR(100) COMMENT '电子邮箱',
    PRIMARY KEY ( id )
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;`
  //alter table users drop column introduction; 
// alter table users add column introduction VARCHAR(100);
let comments =`
  create table if not exists comments(
    id INT NOT NULL AUTO_INCREMENT,
    userName VARCHAR(50) NOT NULL COMMENT '用户名',
    date VARCHAR(20) NOT NULL COMMENT '评论时间',
    content VARCHAR(2000) NOT NULL COMMENT '评论内容',
    movieName VARCHAR(100) NOT NULL COMMENT '影片名',
    movieid VARCHAR(30) NOT NULL COMMENT '影片id',
    avatar VARCHAR(100) NOT NULL DEFAULT '' COMMENT '头像',
    coverimage VARCHAR(100) NOT NULL DEFAULT '' COMMENT '影片封面图片',
    PRIMARY KEY ( id )
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;`
  // alter table comments add column coverimage varchar(100) not null DEFAULT ''　COMMENT '影片封面图片'
let scores =`
  create table if not exists scores(
    id INT NOT NULL AUTO_INCREMENT,
    userName VARCHAR(50) NOT NULL COMMENT '用户名',
    movieName VARCHAR(100) NOT NULL COMMENT '影片名',
    coverimage VARCHAR(100) NOT NULL COMMENT '影片封面图片',
    score VARCHAR(100) NOT NULL COMMENT '分数',
    movieid VARCHAR(30) NOT NULL COMMENT '影片id',
    PRIMARY KEY ( id )
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;`
let collections = `
  create table if not exists collections(
    id INT NOT NULL AUTO_INCREMENT,
    userName VARCHAR(50) NOT NULL COMMENT '用户名',
    movieName VARCHAR(50) NOT NULL COMMENT '影片名',
    coverimage VARCHAR(100) NOT NULL COMMENT '影片封面图片',
    movieid VARCHAR(20) NOT NULL COMMENT '影片id',
    PRIMARY KEY ( id )
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;`
let createTable = ( sql ) => {
  return query( sql, [] )
}
// 建表
createTable(movies)
createTable(adminusers)
createTable(users)
createTable(comments)
createTable(scores)
createTable(collections)
// 添加后台用户
let addAdminUser = ( value ) => {
  let _sql = `insert into adminusers set username=?,password=?;`
  return query( _sql, value)
}

// 查找用户
let findAdminUser = (name) => {
	var _sql = `select * from adminusers where username="${name}"; `
  return query( _sql )
}
// 查询所有数据
let findData = (table) => {
	var _sql = `select * from ${table}; `
  return query( _sql )
}
// 分页数据查找
let findPageData = (table,page,num) => {
  var _sql = `select * from ${table} limit ${(page - 1) * num},${num}; `
  return query(_sql)
}

// 通过id查找
let findDataById = (id) => {
	var _sql = `select * from movies where id="${id}"; `
  return query( _sql )
}
// 增加movies数据
let insertData = ( value ) => {
  let _sql = `insert into movies set moviename=?,country=?,classification=?,date=?,coverimage=?,length=?,type=?,director=?,actors=?,brief=?,language=?;`
  return query( _sql, value )
}
let updateMovieData = ( value ) => {
  let _sql = `update movies set moviename=?,country=?,classification=?,date=?,coverimage=?,length=?,type=?,director=?,actors=?,brief=?,language=? where id=?;`
  return query( _sql, value )
}

// 删除movie
let deleteMovie = ( id ) => {
  let _sql = `delete from movies where id="${id}"; `
  return query( _sql )
}

// **********************前端***********************

// 通过用户名查找用户
let findUserByName = ( name ) => {
  var _sql = `select * from users where userName="${ name }";`
  return query( _sql )
}

// 添加用户
let addUser = ( value ) => {
  var _sql = `insert into users set userName=?,password=?,time=?`
  return query( _sql , value)
}

// 通过classify查找
let findDataByClassify = (classifyName) => {
  var _sql = `select * from movies where classification="${classifyName}"; `
  return query( _sql )
}

let getDataByMovieId = ( id ) => {
  var _sql = `select * from movies where id="${id}"; `
  return query( _sql )
}

// 修改用户信息 comment,scores,collections也要修改
let updateUserName = (value ) => {
  var _sql = `update users set userName=?, introduction=?, github=?, blog=?, email=? where userName=?;`
  return query( _sql,value)
}

let updateUserInfo = (value ) => {
  var _sql = `update users set introduction=?, github=?, blog=?, email=? where userName=?;`
  return query( _sql,value)
}

let updateCommentUserName = ( value ) => {
  var _sql = `update comments set userName=? where userName=?;`
  return query( _sql , value)
}
let updateScoresUserName = ( value ) => {
  var _sql = `update scores set userName=? where userName=?;`
  return query( _sql , value)
}
let updateCollectionsUserName = ( value ) => {
  var _sql = `update collections set userName=? where userName=?;`
  return query( _sql , value)
}

// 添加头像
let updateUserAvatar = ( value ) => {
  var _sql = `update users set avatar=? where userName=?;`
  return query( _sql , value)
}
// 修改评论里的头像
let updateCommentAvatar = ( value ) => {
  var _sql = `update comments set avatar=? where userName=?;`
  return query( _sql , value)
}
// 增加评论
let addComment = (value) => {
  var _sql = `insert into comments set userName=?,date=?,content=?,movieName=?,movieid=?,avatar=?,coverimage=?;`
  return query( _sql , value )
}
// 通过movieid获取评论
let getCommentByMovieId = (id) => {
  var _sql = `select * from comments where movieid="${id}"; `
  return query( _sql )
}
// 通过用户名获取评论
let getCommentByUser = (name) => {
  var _sql = `select * from comments where userName="${name}"; `
  return query( _sql )
}

// 删除评论
let deleteComment = (id) => {
  var _sql = `delete from comments where id="${id}"; `
  return query( _sql )
}

let search = ( value ) => {
  var _sql = `select * from movies where moviename like '%${value}%';`
  return query( _sql )
}
// 保存分数
let saveScore = ( value ) => {
  let _sql = `insert into scores set userName=?,movieName=?,coverimage=?,score=?,movieid=?;`
  return query( _sql, value )
}
// 通过movieid和userName查找评价过的movie
let searchScoreByMovieId=(movieid,userName)=>{
  var _sql = `select * from scores where movieid="${movieid}" and userName="${userName}";`
  return query( _sql )
}
// 通过movieid和userName更新movie分数
let updateScore=(score,movieid,userName)=>{
  var _sql = `update scores set score="${score}" where movieid="${movieid}" and userName="${userName}";`
  return query( _sql)
}
// 通过movieid查找评价过的movie
let getSingleMovieScore=(movieid)=>{
  var _sql = `select * from scores where movieid="${movieid}";`
  return query( _sql )
}
// 保存平均分数到movies表中
let saveScoreToMovies = ( meanScore,movieid ) => {
  var _sql = `update movies set scores="${meanScore}" where id="${movieid}";`
  return query( _sql)
}

// 删除用户评价
let deleteEvaluateScore = (userName,movieid) => {
  let _sql = `delete from scores where userName="${userName}" and movieid="${movieid}";`
  return query( _sql )
}

// 通过userName查找评价过的movie
let getMovieScoreByUsername=(userName)=>{
  var _sql = `select * from scores where userName="${userName}";`
  return query( _sql )
}

// 保存collection
let saveCollection = (value) => {
  let _sql = `insert into collections set userName=?,movieName=?,coverimage=?,movieid=?;`
  return query( _sql, value )
}
// userName和movieid查找collections
let findCollection = (userName,movieid) => {
  var _sql = `select * from collections where movieid="${movieid}" and userName="${userName}";`
  return query( _sql )
}
// 删除
let deleteCollection=(userName,movieid)=>{
  let _sql = `delete from collections where userName="${userName}" and movieid="${movieid}";`
  return query( _sql )
}

// 增加movies收藏数
let increaseCollectionNum=(movieid)=>{
  let _sql = `update movies set collection = collection + 1 where id="${movieid}"`
  return query( _sql)
}
// 增加movies收藏数
let reduceCollectionNum=(movieid)=>{
  let _sql = `update movies set collection = collection - 1 where id="${movieid}"`
  return query( _sql)
}
// 通过userName查找收藏过的movie
let getCollectionByUsername=(userName)=>{
  var _sql = `select * from collections where userName="${userName}";`
  return query( _sql )
}

// 通过userName,movieid查找收藏过的movie
let getCollectionByUsernameMovieid=(userName,movieid)=>{
  var _sql = `select * from collections where userName="${userName}" and movieid="${movieid}";`
  return query( _sql )
}

// 个人信息设置


module.exports = {
  addAdminUser,
  findAdminUser,
  findData,
  findPageData,
  findDataById,
  insertData,
  updateMovieData, 
  deleteMovie,
 
  ///////
  findUserByName,
  addUser,
  findDataByClassify,
  getDataByMovieId,
  updateUserName,
  updateUserInfo,
  updateCommentUserName,
  updateScoresUserName,
  updateCollectionsUserName,
  updateUserAvatar,
  updateCommentAvatar,
  addComment,
  getCommentByMovieId,
  getCommentByUser,
  deleteComment,
  search,
  saveScore,
  searchScoreByMovieId,
  updateScore,
  getSingleMovieScore,
  saveScoreToMovies,
  deleteEvaluateScore,
  saveCollection,
  findCollection,
  deleteCollection,
  increaseCollectionNum,
  reduceCollectionNum,
  getMovieScoreByUsername,
  getCollectionByUsername,
  getCollectionByUsernameMovieid
}