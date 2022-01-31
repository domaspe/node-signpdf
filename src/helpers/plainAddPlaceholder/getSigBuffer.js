import PDFObject from '../pdfkit/pdfobject';

const escapableRe = /[\n\r\t\b\f()\\]/g;
const unicodedKeys = ['Reason', 'Name', 'Location'];

const isUnicode = (value) => {
    for (let i = 0, end = value.length; i < end; i += 1) {
        if (value.charCodeAt(i) > 0x7f) {
            return true;
        }
    }

    return false;
};

const valueToUnicodeBuffer = (value) => Buffer.concat([Buffer.from('('), Buffer.from(`\ufeff${value}`, 'utf16le').swap16(), Buffer.from(')')]);

const getValueBuffer = (key, value) => {
    if (unicodedKeys.includes(key) && isUnicode(value)) {
        const cleanValue = value.replace(escapableRe, () => '');
        return valueToUnicodeBuffer(cleanValue);
    }
    return Buffer.from(PDFObject.convert(value));
};

// This is a workaround of a bug that makes unicode values lost by converting
// it to 'binary' string and later converting all pdf buffer 'binary' string again.
// This workaround does not convert values to binary and writes them straight to the buffer
const getSigBuffer = (input) => {
    const buffer = Buffer.concat([
        Buffer.from('<<\n'),
        ...Object.keys(input).flatMap(key => [
            Buffer.from(`/${key} `),
            getValueBuffer(key, input[key]),
            Buffer.from('\n'),
        ]),
        Buffer.from('>>'),
    ]);

    return buffer;
};

export default getSigBuffer;
