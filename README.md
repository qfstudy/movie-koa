# vuemovie

技术栈：`vue2` + `vue-router` + `axios` + `sass` + `koa2`+ `koa-views` + `七牛` + `阿里字体图标` + `mysql`

前后端分离，前段主要是veu实现，后端主要是koa2实现。

[前端项目地址](https://github.com/qfstudy/movie-vue)

[前端预览地址](http://movie.qifei.site)

[后端项目地址](https://github.com/qfstudy/movie-koa)

[后端预览地址](http://madmin.qifei.site)

### 安装MySql数据库
首先需要在本地安装MySql数据库

### 登录数据库
`mysql -u root -p`

### 创建数据库
`create database moviedemo`

### 下载项目到本地

后端代码：`git clone git@github.com:qfstudy/movie-koa.git`

前端代码：`git clone git@github.com:qfstudy/movie-vue.git`

### 七牛配置
因为这个项目的头像和影视图片都上传到七牛，然后将图片链接保存到数据库中，所以在运行项目之前需要自己配置一下七牛。

如果不想用七牛的也可以自己改后端代码将图片保存到本地项目文件夹下。

七牛的使用可以查看官方文档以及官网

[七牛官网](https://portal.qiniu.com/create)

[七牛开发者中心](https://developer.qiniu.com/kodo/sdk/1289/nodejs)

### 运行后端项目

`cd movie-koa`

`npm i`

`node index.js`

### 运行前端项目

`cd movie-vue`

`npm i`

`npm run dev`

### 前端功能
1. 注册、登录、登出和验证码登录验证
2. 登录后可以在个人主页上传头像和更换头像，还可以在设置页填写个人博客、github地址等个人信息
3. 登录后在影片详情页可以评论，评分和收藏，也可以删除评论，删除评分和取消收藏
4. 在影片详情页可以看到某个影片的所有评分的平均分数以及收藏数
5. 修改用户名
6. 删除文章功能
7. 搜索功能，可以搜索存在的影片
8. 在个人主页可以看到个人填写的信息以及个人评论、评价和收藏过的影片
9. 通过后台上传影片相关信息，然后在前台展示

### 后端管理后台功能
1. 注册、登录、登出
2. 上传影片信息
3. 修改已上传的影片信息
4. 删除已上传的影片信息

### 项目线上地址
前端预览: [vuemo-vue](http://movie.qifei.site)

后端预览：[管理后台](http://madmin.qifei.site)
