import error from "./error.js";
import log from "./log.js";
import file from './file.js';
import notice from './notice.js';
import school from './school.js';
import studyRoom from './studyRoom.js';
import user from './user.js';

export default (app) => {
    app.use(error);
    app.use(log);
    app.use(file);
    app.use(notice);
    app.use(school);
    app.use(studyRoom);
    app.use(user);
}

