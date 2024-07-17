require('dotenv').config();
const he = require('he');
const uuid = require('uuid');
const mysql = require('mysql2');
const parse = require('./routes/parse');
const catalog = require('./routes/catalog');
const summary = require('./routes/summary');
let sum = 0;
let sumdata = "";
const sum_target = 30; // n개의 기사의 데이터만 요약하도록 지정

const connection = mysql.createConnection({ //.env에서 DB정보 가져와서 연결설정
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

const extractData = (inputString) => {
    const numberMatch = inputString.match(/\[(\d+)\]/);
    const catalog = inputString.replace(/\[\d+\]/, '').trim();
    const important = numberMatch ? parseInt(numberMatch[1], 10) : null;
    return { important, catalog };
};

function formatDate(inputDateStr) {
    let date = new Date(inputDateStr);
    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

connection.connect((err) => { // MySQL 서버에 연결
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    sum = 0;
    console.log('connected as id ' + connection.threadId);
    
    parse.article("경제", 50) //네이버 API 검색 제목 설정 , 검색 갯수 설정
        .then(articles => {
            let queryPromises = [];
            for (const article of articles) {
                const queryPromise = catalog.get(article.title, article.description)
                catalog.get(article.title, article.description)
                    .then(data => {
                        const { important,catalog }= extractData(data);
                        if (sum < sum_target) {
                            sumdata = sumdata + " // 다음 기사 //" + cleanStr(article.title);
                            sum++;
                        }
                        const newUUID = uuid.v4(); // 랜덤 UUID 생성
                        const insertQuery = 'INSERT INTO article (title,category,id,description,pub_date,link,important) VALUES (?, ?, ?, ?, ?, ?, ?)';
                        const insertValues = [cleanStr(article.title), cleanStr(catalog), newUUID, cleanStr(article.description), formatDate(article.pubDate), article.link,important];
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
                    });``
                queryPromises.push(queryPromise);
            }
            Promise.all(queryPromises)
                .then(() => {
                    setTimeout(() => {
                        summary.sum(sumdata)
                            .then(data => {
                                const insertQuery = 'INSERT INTO summary (day, phrase) VALUES (?, ?)';
                                const values = [getTodayDate(), data];

                                connection.query(insertQuery, values, (error, results, fields) => {
                                    if (error) {
                                        console.error('Error inserting summary:', error.stack);
                                        return;
                                    }
                                    console.log('summary inserted successfully:', results);
                                    console.log(data)
                                    connection.end();
                                });
                            })
                        console.log('All queries completed. Closing connection.');
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
