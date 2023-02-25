import { Router } from 'express';
import fs from 'fs';
import { path } from '../config/index.js';
import { sendErr, checkErr, send,uploadFile } from '../utils/index.js';

const route = Router();

route.get('/vite.svg', (req, res) => {
    console.log(req.url);
    res.sendFile(path.publicPath + req.url);
})

route.post('/uploadFile',(req,res)=>{
    //判断文件是否存在
    if (!req.files) {
        sendErr('uploadFile:文件不存在');
        return;
    }
    const fileName=`${Date.now()}.png`
    const filePath=`${path.staticPath}/${fileName}`;
    //写入文件
    uploadFile(res,req.files[0].path,filePath,()=>{
        //上传成功
        send(res,{
            filePath:`/static/${fileName}`
        })
    })
})
export default route;