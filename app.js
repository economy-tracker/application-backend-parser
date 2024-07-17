require('dotenv').config();
const he = require('he');
const uuid = require('uuid');
const mysql = require('mysql2');
const parse = require('./routes/parse');
const catalog = require('./routes/catalog');
let sum = 0;

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: process.env.DB_CHARSET,
    timezone: process.env.DB_TIMEZONE
});

function cleanStr(htmlString) { //html 태그 삭제 및 QUOT; 제거하는 문자열
    const withoutTags = htmlString.replace(/<[^>]*>?/gm, '');
    const withoutEntities = he.decode(withoutTags);
    return withoutEntities;
}

function formatDate(inputDateStr) {
    let date = new Date(inputDateStr);
    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

// MySQL 서버에 연결
connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    sum = 0;
    console.log('connected as id ' + connection.threadId);
    parse.article("경제", 100) //네이버 API 검색 제목 설정 , 검색 갯수 설정
        .then(articles => {
            let queryPromises = [];
            for (const article of articles) {
                const queryPromise = catalog.get(article.title, article.description)
                catalog.get(article.title, article.description)
                    .then(data => {
                        sum++;
                        const newUUID = uuid.v4(); // 랜덤 UUID 생성
                        const insertQuery = 'INSERT INTO article (title,category,id,description,pub_date,link) VALUES (?, ?, ?, ?, ?, ?)';
                        const insertValues = [cleanStr(article.title), cleanStr(data), newUUID, cleanStr(article.description), formatDate(article.pubDate), article.link];
                        connection.query(insertQuery, insertValues, (err, result) => {
                            if (err) {
                                console.error('Error inserting into database:', err);
                                return;
                            }
                            console.log('Inserted article with ID:', result.insertId);
                            console.log('Article title:', cleanStr(article.title));
                        });
                    })
                    .catch(err => {
                        console.error('Error getting catalog data:', err);
                    });
                queryPromises.push(queryPromise);
            }
            Promise.all(queryPromises)
                .then(() => {
                    setTimeout(() => {
                        console.log('All queries completed. Closing connection.');
                        connection.end();
                    }, 1000)

                })
                .catch(err => {
                    setTimeout(() => {
                        console.error('Error running queries:', err);
                        connection.end();
                    }, 1000)
                });
        })
});
