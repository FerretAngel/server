// const Jwt = require('jsonwebtoken');
// const config = require('../../config');
// const Pool = require('../connect');
// const nodeExcel = require('excel-export');
// const os = require('os');
import nodeExcel from 'excel-export';
import Jwt from 'jsonwebtoken';
import fs from 'fs';
import os from 'os';
import { token } from '../config/index.js';
import Pool from '../utils/connect.js'
import { expressjwt } from 'express-jwt';

//执行sql
export function perfromSql(res, sql, resusltCallBack) {
    Pool.getConnection((err, conn) => {
        if (checkErr(err, res)) {
            conn.query(sql, (err, result) => {
                conn.release();
                if (checkErr(err, res)) {
                    resusltCallBack(result);
                }
            })
        }
    })
}
//上传文件
export function uploadFile(res,sourceFilePath,path,callBack){
    fs.readFile(sourceFilePath, function (err, data) {  // 异步读取文件内容
        fs.writeFile(path, data, function (err) { // des_file是文件名，data，文件数据，异步写入到文件
            if (checkErr(err,res)) {
                //删除多余的文件
                fs.unlink(sourceFilePath, err => {
                    checkErr(err,res);
                })
                callBack();
            }
        });
    });
}
//删除文件
export function deleteFile(res,fileName,callBack){
    fs.unlink(fileName,err=>{
        if(checkErr(err,res)){
            callBack();
        }
    })
}
/* 
desc:格式化为JSON
parm:
return:JSON
*/
export function toJson(parm) {
    return JSON.parse(JSON.stringify(parm))
}
/* 
desc:新建一个token
parm:data,time? 
return:String  token字符串
*/
export function ceateToken(data, time = token.time) {
    return 'Bearer ' + Jwt.sign(data, token.secretKey, { expiresIn: time })
}
/* 
desc:解码token
parm:req
return:obj
*/
export function parseToken(req) {
    // console.log('parseToken:',req.user,req.auth);
    return req.auth
}
/* 
desc:向客户端返回数据
parm:res,data?,message?
return:null
*/
export function send(res, ...arr) {
    let data;
    let message = '成功';
    arr.forEach(item => {
        if (typeof (item) == 'string') {
            message = item;
        } else {
            data = item;
        }
    })
    res.send({
        code: 0,
        message: message,
        data: data
    })
}
/* 
desc:向客户端返回错误信息
parm:res,message,data?
return:null
*/
export function sendErr(res, ...arr) {
    let errCode = 200;
    let data = {};
    let message = '';
    arr.forEach(item => {
        switch (typeof (item)) {
            case 'number':
                errCode = item;
                break;
            case 'string':
                message = item;
                break;
            case 'object':
                data = item;
                break;
            default:
                throw new Error('sendErr:参数错误').catch(err => {
                    console.error("sendErr:参数错误", err.message);
                })
        }
    })
    res.status(errCode).send({
        code: 1,
        data: data,
        message: message
    })
}
/* 
    desc:用于检查用户对象的完整性
    parm:userObj
    return:obj{
        code:number,错误码
        message:string 错误信息
    }
 */
export function checkUser(user) {
    if (!user.username || !user.password) {
        return {
            code: 1,
            message: '账户或密码为空'
        }
    } else if ((user.username.length < 4 && user.username.length > 20) ||
        (user.password.length < 4 && user.password.length > 20)) {
        return {
            code: 2,
            message: '账户或密码长度必须在4-20位之间'
        }
    } else if (!user.real_name || user.real_name.length < 1 || user.real_name.length > 10) {
        return {
            code: 3,
            message: '昵称不存在或不合法'
        }
    }
    else {
        return {
            code: 10,
            message: '验证通过'
        }
    }
}
/* 
desc:出错检查
parm:errorObj
return:1或者抛出异常
*/
export function checkErr(err, res) {
    if (!err) {
        return true;
    }
    //如果存在res,则直接发送到前端
    if (res) {
        sendErr(res, err.message)
        console.error(err.message);
        return false;
    }
    //抛出异常
    throw new Error(err.message).catch(err => {
        console.error(err.message);
    })
}
/* 
desc:获取服务器ip
parm:null
return:String =>ip地址
*/
export function getIp() {
    var interfaces = os.networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return ''
}

/* 
desc:生成add的sql语句
parm:String=>表名，obj=>表结构,obj=>添加的数据
return:String=>add的sql语句
*/
export function getAddSql(tableName = '', tableObj = {}, dataObj = {}) {
    let tableHeadStr = '';
    let tableDataStr = '';
    for (const dataKey in dataObj) {
        let realKey = dataKey
        if (Object.hasOwnProperty.call(tableObj, realKey) &&
            Object.hasOwnProperty.call(dataObj, dataKey)) {
            const headValue = tableObj[realKey];
            const dataValue = dataObj[dataKey];
            if (realKey != 'id') {
                tableHeadStr += '`' + realKey + '`,'
                if (headValue['type'] == 'number') {
                    tableDataStr += `${dataValue},`
                } else {
                    tableDataStr += `'${dataValue}',`
                }
            }
        }
    }
    return `insert into ${tableName} (${tableHeadStr.slice(0, -1)}) values (${tableDataStr.slice(0, -1)})`
}
/* 
desc:生成update的sql语句
parm:String=>表名，obj=>表结构,obj=>需要更新的数据
return:string=>update sql语句
*/
export function getUpdateSql(tableName = '', tableObj = {}, dataObj = {}) {
    let sql = '';
    delete dataObj.create_time;
    delete dataObj.update_time;
    for (const dataKey in dataObj) {
        let realKey = dataKey
        if (Object.hasOwnProperty.call(dataObj, dataKey) &&
            Object.hasOwnProperty.call(tableObj, realKey)) {
            const dataValue = dataObj[dataKey];
            const type = tableObj[realKey]['type'];
            if (dataValue + '' != '' && dataKey != 'id') {
                //如果这个值不为空才更新该字段
                if (type == 'string' && dataValue != 'null') {
                    sql += `${realKey}='${dataValue}',`
                } else if (dataValue == 'null') {
                    sql += `${realKey} = NULL,`
                } else {
                    sql += `${realKey}=${dataValue},`
                }
            }
        }
    }
    return `update ${tableName} set ${sql.slice(0, -1)} where id=${dataObj['id']}`
}
/* 
desc:生成delete语句
parm:string=>表名 ,Array=>删除的ids
return:string =>sql
*/
export function getDeleteSql(tableName = '', ids = []) {
    let str = ''
    ids.forEach(item => {
        str += `${item},`
    })
    if (ids.length == 0) {
        return ``
    }
    return `delete from ${tableName} where id in (${str.slice(0, -1)})`
}
/* 
desc:解析tableObj
parm:tableObj , Array? => 排除的字段名
return:String => 查询结果集的字段名
*/
export function getSelectRestult(tableObj = null, arr = []) {
    if (tableObj == null || typeof (tableObj) == 'array') {
        return `*`
    }
    let resultStr = '';
    for (const key in tableObj) {
        if (Object.hasOwnProperty.call(tableObj, key)) {
            let isOk = true
            //检测该字段是否排除
            arr.some(item => {
                if (item == key) {
                    isOk = false
                    return true
                }
            })
            if (isOk) {
                const value = tableObj[key];
                if (Object.hasOwnProperty.call(value, 'value')) {
                    let str = ''
                    let childObj = value['value']
                    for (const childKey in childObj) {
                        if (Object.hasOwnProperty.call(childObj, childKey)) {
                            const childValue = childObj[childKey];
                            if (childKey == 'null') {
                                str += `    when ${key} IS NULL then '${childValue}'\n`
                            } else {
                                str += `    when ${key}=${childKey} then '${childValue}'\n`
                            }
                        }
                    }
                    resultStr += `(case ${str.trim()}\n    else ''\n end) as '${value.desc}',\n`
                } else {
                    resultStr += `${key} as '${value.desc}',\n`
                }
            }
        }
    }
    return (resultStr.trim().slice(0, -1))
}

/* 
desc:解析query成slelct sql语句
parm:String => 表名,Obj=> 表结构 ,obj =>queryObj,Array => 排除的字段名
return:Array[String] => [0]=>select sql 语句, [1] => select count(id) sql语句
*/
export function decodeQueryToSelectSql(tableName = {}, tableDesc = {}, query = {}, array = []) {
    let headStr = '';
    let whereStr = '';
    let orderStr = 'id';
    let limitStr = '';

    let isRefindQuery = false;
    for (const key in query.refindQuery) {
        if (Object.hasOwnProperty.call(query.refindQuery, key)) {
            const value = query.refindQuery[key];
            if ((value + '').length > 0) {
                isRefindQuery = true;
                break;
            }
        }
    }

    for (const tableKey in tableDesc) {
        if (Object.hasOwnProperty.call(tableDesc, tableKey)) {
            const tableValue = tableDesc[tableKey];

            //拼接headStr
            let isExClude = false;//是否被排除
            array.some(item => {
                if (item == tableKey) {
                    isExClude = true;
                    return true;
                }
            })
            if (!isExClude) {//如果没有被排除
                const value = tableDesc[tableKey];
                //吧表头换成描述的字段
                if (Object.hasOwnProperty.call(value, 'value')) {
                    let str = ''
                    let childObj = value['value']
                    for (const childKey in childObj) {
                        if (Object.hasOwnProperty.call(childObj, childKey)) {
                            const childValue = childObj[childKey];
                            if (childKey == 'null') {
                                str += `    when ${tableKey} IS NULL then '${childValue}'\n`
                            } else {
                                str += `    when ${tableKey}=${childKey} then '${childValue}'\n`
                            }
                        }
                    }
                    headStr += `(case ${str.trim()}\n    else ''\n end) as '${value.desc}',`
                } else if (Object.hasOwnProperty.call(value, 'desc')) {
                    headStr += `${tableKey} as '${value.desc}',`
                } else {
                    headStr += `${tableKey},`
                }
            }

            //拼接whereStr
            //判断是模糊查询还是精确查询
            let fuzzyStr = query['fuzzyQuery']
            let isFuzzy = fuzzyStr.length > 0;
            if (isFuzzy) {//模糊查询
                if (fuzzyStr == 'null' || fuzzyStr == 'NULL') {
                    whereStr += ` ${tableKey} is NULL or `
                } else {
                    whereStr += ` ${tableKey} like '%${fuzzyStr}%' or `
                }
            } else if (isRefindQuery) {//精确查询
                //判断是否有这个查询条件
                let queryObj = query['refindQuery']
                if (Object.hasOwnProperty.call(queryObj, tableKey)) {
                    //如果有这个条件
                    let refindQueryStr = queryObj[tableKey];
                    // console.log(queryObj);
                    if (refindQueryStr == 'null' || refindQueryStr == 'NULL') {
                        whereStr += ` ${tableKey} is NULL and`
                    } else if (refindQueryStr.length > 0) {
                        if (tableValue.type == 'number') {
                            whereStr += ` ${tableKey}=${refindQueryStr} and`
                        } else {
                            whereStr += ` ${tableKey} like '%${refindQueryStr}%' and`
                        }
                    }
                }
            }
        }
    }

    //limit 拼接
    let queryPage = query['queryPage']
    limitStr += `${(queryPage.currentPage - 1) * queryPage.pageSize},${queryPage.pageSize}`

    //拼接sql
    let sql = `select ${headStr.slice(0, -1)} from ${tableName} ${whereStr.length > 0 ? 'where' : ''} ${whereStr.slice(0, -3)} order by ${orderStr} limit ${limitStr}`
    let countSql = `select COUNT(id) as count from ${tableName} ${whereStr.length > 0 ? 'where' : ''} ${whereStr.slice(0, -3)}`
    // console.log(`

    // ${sql}

    // `);
    return [sql, countSql]
}
/* 
desc:查询函数
parm:req,res,String=>tableName,tableDescObj,array?
return:null
*/
export function query(req, res, tableName, tableDesc, array = []) {
    let query = req.body;
    let user = req.auth;
    if (user.user_type > 0) {
        Pool.getConnection((err, conn) => {
            if (checkErr(err, res)) {
                let selectArray = decodeQueryToSelectSql(tableName, tableDesc, query, array)
                let totle = 0;
                conn.query(selectArray[1], (err, result_totle) => {
                    if (checkErr(err, res)) {
                        totle = result_totle[0]['count'];
                        if (totle > 0) {
                            conn.query(selectArray[0], (err, result) => {
                                if (checkErr(err, res)) {
                                    let obj = query;
                                    obj['queryPage']['maxPage'] = Math.ceil(totle / query.queryPage.pageSize);
                                    obj['data'] = result;
                                    send(res, obj)
                                }
                                conn.release()
                            })
                        } else {
                            let obj = query;
                            obj['queryPage']['maxPage'] = Math.ceil(totle / query.queryPage.pageSize);
                            obj['data'] = [];
                            send(res, obj)
                            conn.release()
                        }
                    }
                })
            }
        })
    } else {
        sendErr(res, '权限不足,需要权限管理员以上', user_type)
    }
}
/* 
desc:生成excel表数据并返回
parm:
return:null
*/
export function sendExcel(res, tableName, tableDesc, arr = []) {
    Pool.getConnection((err, conn) => {
        if (checkErr(err, res)) {
            let sql = `select ${getSelectRestult(tableDesc, arr)} from ${tableName}`
            conn.query(sql, (err, result) => {
                if (checkErr(err, res)) {
                    let config = {};
                    config['cols'] = []
                    for (const key in tableDesc) {
                        if (Object.hasOwnProperty.call(tableDesc, key)) {
                            const value = tableDesc[key];
                            //是否为排除的字段
                            let isOk = true;
                            arr.some(item => {
                                if (item == key) {
                                    isOk = false;
                                    return true;
                                }
                            })
                            if (isOk) {
                                let itemObj = {}
                                if (Object.hasOwnProperty.call(value, 'desc')) {
                                    itemObj['caption'] = value['desc'];
                                } else {
                                    itemObj['caption'] = key;
                                }
                                itemObj['type'] = value['type'] ?? 'string';
                                config.cols.push(itemObj);
                            }
                        }
                    }
                    //表头
                    //表数据
                    let rowArr = [];
                    result.forEach(item => {
                        let row = [];
                        for (const key in item) {
                            row.push(item[key]);
                        }
                        rowArr.push(row);
                    })
                    config['rows'] = [...rowArr];

                    res.setHeader('Content-Type', 'application/vnd.openxmlformats;charset=utf-8');
                    res.setHeader("Content-Disposition", "attachment; filename=" + tableName + ".xlsx");
                    res.end(nodeExcel.execute(config), 'binary')
                }
            })
        }
    })
}

// module.exports = {
//     ceateToken, parseToken, send, sendErr, sendExcel,
//     checkUser, toJson, checkErr, getIp, getSelectRestult,
//     getAddSql, getUpdateSql, getDeleteSql, decodeQueryToSelectSql, query,perfromSql
// }