const axios = require('axios');
const { clientId, clientSecret, api_key } = process.env;


//** OPENAI API로 기사 내용 요약하기 */
async function sum(data) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "If I provide several articles, you provide me with a summary of the current Korean economy based on the articles in Korean in 20 hangul characters or less (more than 15 hangul characters). Sentences cannot end with ‘입니다.’ .And summarizes news that is slightly larger than trivial news"
        },
        {
          role: "user",
          content: "ARTICLES : " + data
        }
      ],
      max_tokens: 50
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      }
    });
    return response.data.choices[0].message.content // GPT 대답 return
  } catch (error) {
    throw error;
  }
}

module.exports = { sum };