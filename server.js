import express from "express";
import multer from 'multer';
import cors from 'cors';
import { expressjwt } from "express-jwt";
import { server, token, path } from './config/index.js';
import { getIp } from './utils/index.js';
import route from "./route/index.js";
const app = express();
//跨域配置
app.use(cors())

// 配置token解码(除了/api/以外的接口都要进行token验证)
app.use(expressjwt({
  secret: token.secretKey,
  algorithms: ['HS256']
}).unless({ path: [/^\/api\//, '/', /^\/static\//, /^\/assets\//, /^\/css\//, /^\/js\//, /^\/fonts\//, '/vite.svg'] }));

//配置multer ，上传文件用
app.use(multer({ dest: 'static' }).array('file'))
//body-parse
app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: false }))
//应用路由
route(app);
//访问静态资源
app.get('/', (req, res) => {
  res.sendFile(path.publicPath + 'index.html')
})
app.use('/static', express.static(path.staticPath))
app.use('/assets', express.static(path.publicPath + 'assets\\'))
app.use('/css',express.static(path.publicPath+'css\\'))
app.use('/js',express.static(path.publicPath+'js\\'))
app.use('/fonts',express.static(path.publicPath+'fonts\\'))

//开始监听
app.listen(server.port, err => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`http://${getIp()}:${server.port}`)
});
// module.exports = app