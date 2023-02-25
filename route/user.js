
import fs from 'fs';
import {sendErr,send,checkUser,
    ceateToken,parseToken,getAddSql,
    getUpdateSql,getDeleteSql,query,
    sendExcel,perfromSql} from '../utils/index.js' ;
import { Router } from 'express';
import {path} from '../config/index.js'
const route =Router();

//表结构
const userDesc = {
    id: {
        desc: 'ID',
        type: 'number'
    },
    username: {
        desc: '用户名',
        type: 'string'
    },
    password: {
        desc: '密码',
        type: 'string'
    },
    real_name: {
        desc: '名字',
        type: 'string'
    },
    user_type: {
        desc: '用户类型',
        type: 'number',
        value: {
            0: '学生',
            1: '管理员',
            2: '超级管理员',
        }
    },
    phone: {
        desc: '手机号',
        type: 'string'
    },
    gender: {
        desc: '性别',
        type: 'number',
        value: {
            // 0: '保密',
            0: '女',
            1: '男',
            null: '未知'
        }
    }
}


/* 
desc:查询user
parm:queryObj
return:queryObj
*/
route.post('/user/query', (req, res) => {
    //检查用户权限
    let user = req.auth;
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //查询数据
    query(req, res, 'user', userDesc, ['password'])
})
//下载user为excel文件
route.get('/user/getExcle', (req, res) => {
    //检查用户权限
    let user = req.auth;
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //发送excel
    sendExcel(res, 'user', userDesc, ['password']);
})
//拿到表的描述信息
route.get('/user/getDesc', (req, res) => {
    //检查权限
    let user = req.auth;
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //发送用户表描述信息
    send(res, userDesc);
})
//解析token为userObj
route.get('/user/getUser', (req, res) => {
    send(res, parseToken(req))
})

//通过id查询用户详情
route.post('/user/queryUserById', (req, res) => {
    let user = req.auth
    let id = req.body.id;
    //权限判断
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //参数验证
    if (typeof (id) != 'number') {
        sendErr(res, '参数不正确');
        return;
    }
    //查询信息
    let sql = `select * from user where id=${id} limit 1`
    perfromSql(res, sql, (result) => {
        //结果集为空
        if (result.length == 0) {
            sendErr(res, '没有查询到数据')
        }
        //返回信息
        send(res, result[0])
    })
})

//账号登录
route.post('/api/login',(req, res) => {
    let user = req.body
    //参数完整性检查
    let check = checkUser(user)
    if (check.code < 3) {
        sendErr(res, '参数不完整')
        return;
    }
    //查询账户信息是否存在
    let sql = `select * from user where username='${user.username}' and password='${user.password}'`
    perfromSql(res, sql, (result) => {
        //结果集为空
        if (result.length == 0) {
            sendErr(res, '账号或密码错误')
            return;
        }
        const {user_type} =result[0];
        //登录成功
        send(res, {
            token: ceateToken({...result[0]}),
            user:{
                user_type
            },
        }, '登录成功')
    })
})


//账号注册
route.post('/api/register', (req, res) => {
    const user = req.body;
    //检查数据完整性
    const check = checkUser(user);
    if (check.code < 4) {
        sendErr(res, check.message);
        return;
    }
    //检查用户是否存在
    let sql = `select id from user where username='${user.username}' limit 1`;
    perfromSql(res, sql, (result) => {
        if (result.length == 1) {
            sendErr(res, '账户已存在');
            return;
        }
        //向user表添加数据
        sql = `insert into user (username,password,real_name) values ('${user.username}','${user.password}','${user.real_name}')`
        perfromSql(res, sql, () => {
            send(res, {}, '注册成功')
        })
    })
})
//更新头像
route.post('/user/updateAvatar', (req, res) => {
    let avatar = req.body.avatar;
    let user = req.auth;
    //检查必要参数
    if (typeof (avatar) != 'string') {
        sendErr(res, '参数错误，需要String');
        return;
    }
    //更新头像链接
    let sql = `update user set avatar='${avatar}' where id=${user.id}`
    perfromSql(res, sql, (result) => {
        //删除旧的头像数据
        if (user.avatar.length > 0) {
            let arr = user.avatar.split('/')
            let filePath = `${path.staticPath}${arr[arr.length - 1]}`;
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log('updateAvatar:删除文件失败', filePath, err.message);
                }
            })
        }
        //返回结果
        send(res, {}, '更新成功');
    })

})

//管理员添加用户
route.post('/user/add', (req, res) => {
    //检查参数
    let check = checkUser(req.body);
    if (check.code < 4) {
        sendErr(res, check.message);
        return;
    }
    //添加数据
    let sql = getAddSql('user', userDesc, req.body);
    perfromSql(res, sql, (result) => {
        send(res, '添加成功');
    })
})
//更新用户信息
route.post('/user/update', (req, res) => {
    let user = req.body;
    //检查参数
    let check = checkUser(user);
    if (check.code < 4) {
        sendErr(res, check.message);
        return;
    }
    let sql=getUpdateSql('user',userDesc,user);
    perfromSql(res,sql,(result)=>{
        send(res,'修改成功！')
    })
})

//删除用户信息
route.post('/user/delete', (req, res) => {
    let ids=[...req.body]
    //检查参数
    if( ids.length==0){
        sendErr(res,'参数为空');
        return;
    }
    let sql=getDeleteSql('user',ids);
    perfromSql(res,sql,(result)=>{
        send(res,'删除成功')
    })
})
export default route;