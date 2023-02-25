// const utils=require('./utils');
// const app=require('./server')
// const errMap=require('./config/errMap')
import errMap from '../config/errMap.js';
import {sendErr} from '../utils/index.js';
export default (err, req, res, next) => {
  // console.log(err);
  if (err) {
    let errCode = errMap.get(err.message);
    if (errCode) {
      sendErr(res, err.message, errCode)
    } else {
      sendErr(res, err.message)
    }
  }
}