require('dotenv').config();
const catalog = require('./routes/catalog');
const extractData = (inputString) => {
    const numberMatch = inputString.match(/\[(\d+)\]/);
    const catalog = inputString.replace(/\[\d+\]/, '').trim();
    const important = numberMatch ? parseInt(numberMatch[1], 10) : null;
    return { important, catalog };
};

catalog.get("삼성전자 신제풀 발표.. 기대에 못 미쳐","삼성전자가 새로운 XR기기를 선보였지만 QC문제가 발생해 구매자들이 만족하지 못하고 있습니다")
    .then(data => {
        console.log(extractData(data));
    });

    catalog.get("빅5 병원, 전공의에 사직처리 통보…이제 어쩔 수 없다","전공의들이 끝내 돌아오지 않으면서 '빅5'로 불리는 대형병원들은 전공의들에게 사직 처리를 단행하겠다는 통보를 보내고 있다.")
    .then(data => {
        console.log(extractData(data));
    });