const axios = require('axios');
const { clientId, clientSecret,api_key } = process.env;


//** OPENAI API로 기사 내용와 정보 가지고 카테고리 데이터 만들기 */
async function get(title,info) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "When I enter article information. ONLY Return the category among this list -> financial,stock, industry,business, nature issue, real estate, global, economy, living economy, north-korea ,other . Do not add any other characters; print only the result.And if you're sure this isn't your topic, don't pick on the economy as often as possible.Please select a clear category to avoid overlapping categories. And set the topic with additional_data as the focus, not the title.(However, if additional_data information is insufficient, decide based on the title). If stock terms are clearly included, classify it as stock. Also, objectively evaluate the importance of the article from 0 to 10 and write it in [ ] at the end of the article. Only give high importance numbers to things that seem very important.And if the name of the region (rather than the name of the country) appears, give the score as low as possible. score is can not be NULL"
          },
          {
            role: "user",
            content: "title: "+ title + " ,additional_data:"+ info
          }
        ],
        max_tokens: 50
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`
        }
      });
  
      return response.data.choices[0].message.content
    } catch (error) {
      throw error;
    }
  }

module.exports = {get};