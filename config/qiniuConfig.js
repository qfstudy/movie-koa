const qiniu = require('qiniu')

let accessKey = '******'
let secretKey = '******'

let mac = new qiniu.auth.digest.Mac(accessKey, secretKey)

let options = {
  scope: 'vue-movie',
  expires: 3153600000
  // returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize)}'
  // callbackBodyType: 'application/json'
}

let putPolicy = new qiniu.rs.PutPolicy(options)
let uploadToken = putPolicy.uploadToken(mac)

let config = new qiniu.conf.Config()
let bucketManager = new qiniu.rs.BucketManager(mac, config);
// 空间对应的机房
config.zone = qiniu.zone.Zone_z2
// 上传是否使用cdn加速
//config.useCdnDomain = true

// ******************

// let localFile = "/Users/jemy/Documents/qiniu.mp4"
let formUploader = new qiniu.form_up.FormUploader(config)
let putExtra = new qiniu.form_up.PutExtra()
// let key='test.mp4'
// 文件上传
let uploadToQiniu = (localFile, key) => {
  return new Promise((resolve, reject) => {
    formUploader.putFile(uploadToken, key, localFile, putExtra, function (respErr, respBody, respInfo) {
      if (respErr) {
        throw respErr
      }
      if (respInfo.statusCode === 200) {
        console.log('qiniu200: ')
        console.log(respBody)
        resolve(respBody)
        // return respBody
      } else {
        console.log('qiniu error2')
        console.log(respInfo.statusCode)
        console.log(respBody)
        reject(respBody)
      }
    })
  })
}

//文件删除

let deleteQiniuFile = (key) => {
  let bucket = "vue-movie"
  // console.log('key666: '+key)
  bucketManager.delete(bucket, key, function (err, respBody, respInfo) {
    if (err) {
      console.log('qiniu delete1')
      console.log(err)
      // throw err
    } else {
      console.log('qiniu delete2')
      console.log(respInfo.statusCode)
      console.log(respBody)
    }
  })
}


module.exports = {
  uploadToQiniu,
  deleteQiniuFile
}