// khsexk code
const express = require('express');

const multer = require('multer');  // img 업로드를 위한 내장모듈
const fs = require('fs');
const path = require('path');

const Post = require('../models/Post');
const { Op } = require("sequelize");
const HashTag = require('../models/HashTag');

const router = express.Router();

// 이미지를 위한 디렉토리 생성
try{
    fs.readdirSync('uploads');
} catch(error){
    console.error('Can not find uploads folder.');
    fs.mkdirSync('uploads');
}

// 이미지 모델
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb){
            cb(null, 'uploads/');
        },
        filename(req, file, cb){
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024},
});

// 게시물을 보여주는 홈
router.get('/', async (req, res, next) => {
    try{
        const postlist = await Post.findAll();
        res.render('post', { postlist });
    } catch(err){
        console.error(err);
        next(err);
    }
});

// 게시물 등록
router.get('/create', async (req, res, next) => {
    try{
        res.render('upload');   // 나중에 id 넘겨줘야함
    } catch(err){
        console.error(err);
        next(err);
    }
});

router.post('/create', upload.single('img'), async (req, res, next) => {
    try{
        console.log(`/uploads/${req.file.filename}`);
        
        Post.max('idx').then(async max => {
            const idx = max + 1;
            
            const post = await Post.create({
                idx: idx,
                id: email,
                uldate: Date.now(),
                img: req.file.filename,
                price: req.body.price,
                content: req.body.content,
            });

            const tags = req.body.tag.match(/#[^\s#]+/g);

            if(tags){
                const result = await Promise.all(
                    tags.map(tag => {
                        return HashTag.findOrCreate({
                            where: { title: tag.slice(1).toLowerCase() },
                        })
                    }),
                );
                await post.addHashTags(result.map(r => r[0]));   // 게시물과 연결
            }
        });

        res.redirect('/post');   // 나중에 id 넘겨줘야함
    } catch(err){
        console.error(err);
        next(err);
    }
});


// 게시물 자세히 보기
router.get('/content', async (req, res, next) => {
    try{
        const post = await Post.findOne({
            where: {
                idx: req.query.idx,
            },
        });

        res.render('content', {post: post});   // 나중에 id 넘겨줘야함
    } catch(err){
        console.error(err);
        next(err);
    }
});


// 해시태그를 통한 검색
router.get('/hashtag', async (req, res, next) => {
    const query = req.query.tag;

    if(!query){
        return res.redirect('/post')
    }
    try{
        const hashtag = await HashTag.findOne({
            where: { title: query },
        });
        let posts= [];

        if(hashtag){
            posts = await hashtag.getPosts();
        }

        res.render('hashtag', { hashtag: query, postlist: posts })
    }catch(error){

    }
})



module.exports = router;