module.exports = {
    searchRegexVietnamese: (searchText) => {
        const accentsMap = {
            a: '[aàáạảãâầấậẩẫăằắặẳẵ]',
            e: '[eèéẹẻẽêềếệểễ]',
            i: '[iìíịỉĩ]',
            o: '[oòóọỏõôồốộổỗơờớợởỡ]',
            u: '[uùúụủũưừứựửữ]',
            y: '[yỳýỵỷỹ]',
            d: '[dđ]',
            A: '[AÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]',
            E: '[EÈÉẸẺẼÊỀẾỆỂỄ]',
            I: '[IÌÍỊỈĨ]',
            O: '[OÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]',
            U: '[UÙÚỤỦŨƯỪỨỰỬỮ]',
            Y: '[YỲÝỴỶỸ]',
            D: '[DĐ]'
        };
        return searchText
            .split('')
            .map(char => accentsMap[char] || char)
            .join('');
    }
};
