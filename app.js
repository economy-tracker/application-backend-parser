require('dotenv').config();
const he = require('he'); // 특수 문자열 처리를 위한 선언
const uuid = require('uuid');
const mysql = require('mysql2');
const parse = require('./routes/parse');
const catalog = require('./routes/catalog');

const connection = mysql.createConnection({
    host: 'hackertone.cyyifb3uzhn6.ap-northeast-2.rds.amazonaws.com',
    port: '3306',
    user: 'hackertone',
    password: 'HtRm5micyyyLMjX',
    database: 'hackertone',
    charset: 'utf8mb4',  // character_set과 관련된 설정
    timezone: 'Asia/Seoul'  // time_zone 설정
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
    console.log('connected as id ' + connection.threadId);
    parse.article("경제", 100) //네이버 API 검색 제목 설정 , 검색 갯수 설정
        .then(articles => {
            let queryPromises = [];
            for (const article of articles) {
                const queryPromise = catalog.get(article.title, article.description)
                try {
                    catalog.get(article.title, article.description)
                        .then(data => {
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
                } catch (err) {
                    console.error('Error getting catalog data:', err);
                }
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