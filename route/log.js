export default (req, res, next) => {
  if (req.auth) {
    console.log(`${req.auth.username}(${req.auth.real_name})：${req.url}`);
  } else {
    console.log(`${req.ip}访问了:${req.url}`);
  }
  next();
}