import { Router } from 'express';
// import {pool} from '../utils/connect';
import {send,sendErr,getAddSql,query,getDeleteSql,getUpdateSql,perfromSql} from '../utils/index.js'
const route = Router();
// const pool = require('./connect')
// const utils = require('./utils');


// const send = utils.send
// const sendErr = utils.sendErr
// const getAddSql = utils.getAddSql
// const query = utils.query
// const getDeleteSql = utils.getDeleteSql
// const getUpdateSql = utils.getUpdateSql
// const perfromSql = utils.perfromSql;

const roomDesc = {
    id: {
        // desc: 'ID',
        type: 'number'
    },
    name: {
        // desc: '名称',
        type: 'string'
    },
    max_row: {
        // desc: '行',
        type: 'number'
    },
    max_col: {
        // desc: '列',
        type: 'number'
    },
    selected_count: {
        // desc: '已选择人数',
        type: 'number'
    },
    disabled_count: {
        // desc: '已选择人数',
        type: 'number'
    },
    create_time: {
        // desc: '创建时间',
        type: 'string'
    },
    update_time: {
        // desc: '更新时间',
        type: 'string'
    },
    open_time: {
        // desc: '开放时间',
        type: 'string'
    },
    close_time: {
        // desc: '关闭时间',
        type: 'string'
    },
}
const roomSeateDesc = {
    id: {
        // desc: 'ID',
        type: 'number',
    },
    room_id: {
        // desc: '自习室ID',
        type: roomDesc.id.type,
    },
    row: {
        // desc: '行',
        type: 'number',
    },
    col: {
        // desc: '列',
        type: 'number',
    },
    enable: {
        // desc: '禁用',
        type: 'number',
    },
    uid: {
        // desc: '用户ID',
        type: 'number',
    },
    creat_time: {
        // desc: '创建时间',
        type: 'string',
    },
    update_time: {
        // desc: '更新时间',
        type: 'string',
    },

}
function checkRoom(roomObj) {
    if (!Object.hasOwnProperty.call(roomObj, 'max_row') ||
        !Object.hasOwnProperty.call(roomObj, 'max_col')
    ) {
        return {
            code: 1,
            message: '不存在行列参数'
        }
    } else if (typeof (roomObj['max_row']) != 'number') {
        return {
            code: 2,
            message: 'max_row not a number'
        }
    } else if (typeof (roomObj['max_col']) != 'number') {
        return {
            code: 2,
            message: 'max_col not a number'
        }
    } else if (!Object.hasOwnProperty.call(roomObj, 'open_time')) {
        return {
            code: 3,
            message: 'don`t have open_time'
        }
    } else if (!Object.hasOwnProperty.call(roomObj, 'close_time')) {
        return {
            code: 4,
            message: 'don`t have close_time'
        }
    } else if (!isNaN(Date.parse(roomObj['open_time']))) {
        return {
            code: 5,
            message: 'open_time is not time String'
        }
    } else if (!isNaN(Date.parse(roomObj['close_time']))) {
        return {
            code: 5,
            message: 'close_time is not time String'
        }
    }
    else {
        return {
            code: 10,
            message: 'check sccuess!'
        }
    }

}
//添加自习室数据
route.post('/studyRoom/add', (req, res) => {
    //检查用户权限
    const user = req.auth
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //检查数据完整性
    const studyRoom = req.body;
    const check = checkRoom(studyRoom);
    if (check.code < 5) {
        sendErr(res, '参数不正确', studyRoom);
        return;
    }
    //添加数据
    let sql = getAddSql('study_room', roomDesc, studyRoom);
    perfromSql(res, sql, (result) => {
        //判断是否有禁用的数据
        if (studyRoom.hasOwnProperty('disableArray') && studyRoom['disableArray'].length > 0) {
            sql = '';
            //拼接sql
            studyRoom.disableArray.forEach(item => {
                item['room_id'] = result['insertId']
                sql += getAddSql('study_room_seate', roomSeateDesc, item) + ';'
            })
            //执行sql
            perfromSql(res, sql, (result) => {
                //发送结果
                send(res, '添加成功')
            })
            return;
        }
        //发送结果
        send(res, '添加成功!');
    })
})

/* 
desc:查询自习室
parm:queryObj{
    queryPage: {
        currentPage: number,//当前页
        pageSize: number,//每页数量
        maxPage: number//最大页
    },
    fuzzyQuery: String,//模糊查询的字符串
    data: Array
}
return:queryObj{
    queryPage: {
        currentPage: number,//当前页
        pageSize: number,//每页数量
        maxPage: number//最大页
    },
    fuzzyQuery: String,//模糊查询的字符串
    data: Array
}
*/
route.post('/studyRoom/query', (req, res) => {
    query(req, res, 'study_room', roomDesc)
})


//查询自习室详情
route.post('/studyRoom/queryDetailsById', (req, res) => {
    //检查权限
    let user = req.auth;
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //检查参数
    let id = req.body.id;
    if (typeof (id) != 'number') {
        sendErr(res, '参数错误，需要{id:number}');
        return;
    }
    //查询数据
    let sql = `select * from study_room_seate where room_id=${id}`;
    perfromSql(res, sql, (result) => {
        if (result.length == 0) {
            sendErr(res, '未查询到数据');
            return;
        }
        send(res, result);
    })
})
//删除数据
route.post('/studyRoom/del', (req, res) => {
    //检查权限
    let user = req.auth;
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //参数验证
    let ids = [...req.body]
    if (ids.length == 0) {
        sendErr(res, '参数错误:[number]');
        return;
    }
    //删除
    let sql = getDeleteSql('study_room', ids);
    perfromSql(res, sql, (result) => {
        send(res, '删除成功');;
    })
})

/* 
desc:更新数据
parm:{
    "id": 1151,
    "name": "珊瑚路815号",
    "max_row": 5,
    "max_col": 6,
    "disableArray": [
        {
            "row": 4,
            "col": 3,
            "enable": 0
        },
        ...
    ],
    "open_time": "2023-01-08T09:48:00",
    "close_time": "2023-04-07T18:14:00"
}
return:result
*/
route.post('/studyRoom/update', (req, res) => {
    let studyObj = req.body;
    //权限验证
    let user = req.auth;
    if (user.user_type < 1) {
        sendErr(res, '权限不足');
        return;
    }
    //更新主表数据
    let sql = getUpdateSql('study_room', roomDesc, studyObj);
    perfromSql(res, sql, (result) => {
        //删除子表旧的数据
        sql = `DELETE FROM study_room_seate WHERE room_id=${studyObj.id} and \`enable\`=0`
        perfromSql(res, sql, (result) => {
            //判断是否有禁用的数据
            if (studyObj.hasOwnProperty('disableArray') && studyObj['disableArray'].length > 0) {
                sql = '';
                //拼接sql
                studyObj.disableArray.forEach(item => {
                    let objData={...item};
                    objData['room_id'] = studyObj.id;
                    delete objData['create_time'];
                    delete objData['update_time'];
                    sql += getAddSql('study_room_seate', roomSeateDesc, objData) + ';'
                })
                //执行sql
                perfromSql(res, sql, (result) => {
                    //发送结果
                    send(res, '修改成功');
                })
                return;
            }
            //发送结果
            send(res, '修改成功!');
        })
    })
})

export default route;