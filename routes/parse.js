const axios = require('axios');
const { clientId, clientSecret,api_key } = process.env;

//** 검색 대상, 검색 갯수 넣으면 네이버 기사 검색하는 함수 */
async function article(query, display) {
    const apiUrl = 'https://openapi.naver.com/v1/search/news.json';
    const sort = 'date';

    try {
        const response = await axios.get(apiUrl, {
            params: {
                query,
                display,
                sort
            },
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            }
        });

        const articles = response.data.items;
        return articles;
    } catch (error) {
        console.error('Error fetching the news:', error);
        throw error;
    }
}

module.exports = {article};