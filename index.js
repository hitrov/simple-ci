const express = require('express');
const bodyParser= require('body-parser');
const multer = require('multer');
const shell = require('shelljs');
const fs = require('fs')

const uploadsDir = `${__dirname}/uploads`;

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
    const { projectsRoot, pm2_process } = req.body;

    if (!projectsRoot) {
        res.status(400);
        res.send(`body.destination is missing.`);

        return;
    }

    if (!pm2_process) {
        res.status(400);
        res.send(`body.pm2_process is missing.`);

        return;
    }

    if (!fs.existsSync(projectsRoot)) {
        res.status(400);
        res.send(`body.destination does not exist.`);

        return;
    }

    const projectPath = `${projectsRoot}/${pm2_process}`;
    console.log(`projectPath: ${projectPath}`);
    if (!fs.existsSync(projectPath)) {
        res.status(400);
        res.send(`${projectPath} - dir does not exist.`);

        return;
    }

    const filename = `${uploadsDir}/${pm2_process}.tar.gz`;
    console.log(`filename: ${filename}`);

    if (!fs.existsSync(filename)) {
        res.status(500);
        res.send(`${filename} - archive does not exist.`);

        return;
    }

    shell.exec(`pm2 stop ${pm2_process}`);

    shell.mv(`${projectPath}`, `${projectPath}.bak`);

    shell.exec(`tar -zxvf ${filename}`);

    shell.rm(`${filename}`);

    console.log(`moving from ${__dirname}/${pm2_process} to ${projectsRoot}`);
    shell.mv(`${__dirname}/${pm2_process}`, projectsRoot);

    shell.exec(`pm2 start ${pm2_process}`);

    res.send(shell.ls(projectsRoot));
});

app.listen(3001);
