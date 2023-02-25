import { fileURLToPath } from "url";
import PATH  from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = PATH.dirname(__filename);
const rootPath=__dirname.replace(/config$/,'')
export const path={
    rootPath,
    staticPath:rootPath+'static\\',
    publicPath:rootPath+'public\\'
}
export const server = {
    port: 8080,
    errCode: 350
}
export const dataBase = {
    host: "127.0.0.1", // 主机地址
    port: 3306,
    database: "web", // 数据库名字
    user: "root", // 连接数据库的用户名
    password: "4664", // 连接数据库密码
    connectionLimit: 20, // 连接池最大连接数
    multipleStatements: true // 允许执行多条sql语句
}
export const token = {
    secretKey: 'ferret',
    time: '24h'
}