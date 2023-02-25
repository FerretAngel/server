import { Router } from "express";
import  pool  from "../utils/connect.js";
const route = Router();
// const pool=require('./connect')
route.get("/school",(req,res)=>{
    pool.getConnection((err,conn)=>{
        if(err){
            console.error("数据库连接池出错",err);
        }else{
            let sql=`select * from school`;
            conn.query(sql,(err,result)=>{
                if(err){
                    console.error("数据库查询失败",err);
                }else{
                    res.send(result);
                    conn.release();
                }
            })
        }
    })
})

export default route;