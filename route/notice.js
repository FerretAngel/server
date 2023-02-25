// const app =require('../server');
import { Router } from 'express';
import fs from 'fs';
import {path} from '../config/index.js';
const route = Router();
import { perfromSql, sendErr, send, getAddSql, getDeleteSql, getUpdateSql, query } from '../utils/index.js';

const noticeDesc = {
    id: {
        type: 'number'
    },
    create_time: {
        type: 'string'
    },
    update_time: {
        type: 'string'
    },
    is_deleted: {
        type: 'number'
    },
    uid: {
        type: 'number'
    },
    notice_content: {
        type: 'string'
    },
    notice_img_src: {
        type: 'string'
    },

}
function checkNotice(noticeObj) {
    if (!noticeObj.hasOwnProperty('notice_content') &&
        typeof (noticeObj['notice_content']) != 'string'
        && !noticeObj['notice_content'].length > 0) {
        return 1;
    } else if (!noticeObj.hasOwnProperty('uid') &&
        typeof (noticeObj['uid']) != 'number') {
        return 2;
    } else if (!noticeObj.hasOwnProperty('notice_img_src') &&
        typeof (noticeObj['notice_img_src']) != 'string'
        && !noticeObj['notice_img_src'].length > 0) {
        return 3;
    } else if (!noticeObj.hasOwnProperty('id') &&
        typeof (noticeObj['id']) != 'number') {
        return 4;
    } else {
        return 10;
    }
}
route.get('/api/getNotice', (req, res) => {
    let sql = `select * from notice where is_deleted=0`
    perfromSql(res, sql, (result) => {
        res.send(result);
    })
})
route.post('/notice/add', (req, res) => {
    const user = req.auth;
    let noticeObj = req.body;
    //检查数据完整性
    if (checkNotice(noticeObj) < 3) {
        sendErr('数据不完整');
        return;
    }
    noticeObj['notice_content'] = noticeObj['notice_content'].replace(/'/g, "`");
    let { notice_content, notice_img_src } = noticeObj
    let sql = getAddSql('notice', noticeDesc, { notice_content, notice_img_src, uid: user.id });
    console.log(sql);
    perfromSql(res, sql, (result) => {
        send(res, '添加成功');
    })
})
route.post('/notice/delete', (req, res) => {
    const user = req.auth;
    let ids = req.body;
    //检查权限
    if (user.user_type < 1) {
        sendErr('权限不足');
        return;
    }
    let sql = `select notice_img_src from notice where id=${req.body[0]}`
    perfromSql(res, sql, result => {
        let src = result[0].notice_img_src;
        console.log(src);
        if (src.length > 0) {
            let arr = src.split('/')
            let filePath = `${path.staticPath}${arr[arr.length - 1]}`;
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log('updateAvatar:删除文件失败', filePath, err.message);
                }
            })
        }
        sql = getDeleteSql('notice', ids);
        console.log(sql);
        perfromSql(res, sql, () => {
            send(res, '删除成功')
        })
    })

})
route.post('/notice/query', (req, res) => {
    query(req, res, 'notice', noticeDesc, ['is_delete']);
})
route.post('/notice/update', (req, res) => {
    const user = req.auth;
    let noticeObj = req.body;
    //检查权限
    if (user.user_type < 1) {
        sendErr('权限不足');
        return;
    }

    noticeObj['notice_content'] = noticeObj['notice_content'].replace(/'/g, "`");
    let sql = getUpdateSql('notice', noticeDesc, noticeObj);
    perfromSql(res, sql, () => {
        send(res, '更新成功')
    })
})
export default route;