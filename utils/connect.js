// const mysql=require("mysql")
// const config=require('../config')
// module.exports=mysql.createPool(config.dataBase)

import mysql from 'mysql';
import {dataBase} from '../config/index.js';
export default mysql.createPool(dataBase);