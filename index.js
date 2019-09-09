const express = require('express');
const bodyParser= require('body-parser');
const multer = require('multer');
const shell = require('shelljs');
const fs = require('fs')

const uploadsDir = 'uploads';
const filename = `${uploadsDir}/build.tar.gz`;

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadsDir)) {
            shell.mkdir(uploadsDir);
        }

        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('dist'), (req, res, next) => {
    if (!process.env.EXPRESS_AUTH) {
        res.status(501);
        res.send(`process.env.EXPRESS_AUTH is missing.`);

        return;
    }

    if (!req.headers.authorization || req.headers.authorization !== process.env.EXPRESS_AUTH) {
        res.status(401);
        res.send(`Unauthorized.`);

        return;
    }

    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error)
    }

    next();
}, (req, res) => {
    if (!req.body.source) {
        res.status(400);
        res.send(`body.source is missing.`);

        return;
    }

    if (!req.body.destination) {
        res.status(400);
        res.send(`body.destination is missing.`);

        return;
    }

    if (!fs.existsSync(req.body.destination)) {
        res.status(400);
        res.send(`body.destination does not exist.`);

        return;
    }

    shell.exec(`tar -zxvf ${filename}`);
    shell.rm(`${filename}`);
    shell.mv(req.body.source, req.body.destination);
    res.send(shell.ls(uploadsDir));
});

app.listen(3001);
