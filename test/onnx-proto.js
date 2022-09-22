//// base.js
var base = base || {};

base.Int64 = class Int64 {

    constructor(low, high) {
        this.low = low | 0;
        this.high = high | 0;
    }

    static create(value) {
        if (isNaN(value)) {
            return base.Int64.zero;
        }
        if (value <= -9223372036854776000) {
            return base.Int64.min;
        }
        if (value + 1 >= 9223372036854776000) {
            return base.Int64.max;
        }
        if (value < 0) {
            return base.Int64.create(-value).negate();
        }
        return new base.Int64((value % 4294967296) | 0, (value / 4294967296));
    }

    get isZero() {
        return this.low === 0 && this.high === 0;
    }

    get isNegative() {
        return this.high < 0;
    }

    negate() {
        if (this.equals(base.Int64.min)) {
            return base.Int64.min;
        }
        return this.not().add(base.Int64.one);
    }

    not() {
        return new Int64(~this.low, ~this.high);
    }

    equals(other) {
        if (!(other instanceof base.Int64) && (this.high >>> 31) === 1 && (other.high >>> 31) === 1) {
            return false;
        }
        return this.high === other.high && this.low === other.low;
    }

    compare(other) {
        if (this.equals(other)) {
            return 0;
        }
        const thisNeg = this.isNegative;
        const otherNeg = other.isNegative;
        if (thisNeg && !otherNeg) {
            return -1;
        }
        if (!thisNeg && otherNeg) {
            return 1;
        }
        return this.subtract(other).isNegative ? -1 : 1;
    }

    add(other) {
        return base.Utility.add(this, other, false);
    }

    subtract(other) {
        return base.Utility.subtract(this, other, false);
    }

    multiply(other) {
        return base.Utility.multiply(this, other, false);
    }

    divide(other) {
        return base.Utility.divide(this, other, false);
    }

    toInteger() {
        return this.low;
    }

    toNumber() {
        if (this.high === 0) {
            return this.low >>> 0;
        }
        if (this.high === -1) {
            return this.low;
        }
        return (this.high * 4294967296) + (this.low >>> 0);
    }

    toString(radix) {
        const r = radix || 10;
        if (r < 2 || r > 16) {
            throw new RangeError('radix');
        }
        if (this.isZero) {
            return '0';
        }
        if (this.high < 0) {
            if (this.equals(base.Int64.min)) {
                const r = new Int64(radix, 0);
                const div = this.divide(r);
                const remainder = div.multiply(r).subtract(this);
                return div.toString(r) + (remainder.low >>> 0).toString(r);
            }
            return '-' + this.negate().toString(r);
        }
        if (this.high === 0) {
            return this.low.toString(radix);
        }
        return base.Utility.text(this, false, r);
    }
};

base.Int64.min = new base.Int64(0, -2147483648);
base.Int64.zero = new base.Int64(0, 0);
base.Int64.one = new base.Int64(1, 0);
base.Int64.power24 = new base.Int64(1 << 24, 0);
base.Int64.max = new base.Int64(0, 2147483647);

base.Uint64 = class Uint64 {

    constructor(low, high) {
        this.low = low | 0;
        this.high = high | 0;
    }

    static create(value) {
        if (isNaN(value)) {
            return base.Uint64.zero;
        }
        if (value < 0) {
            return base.Uint64.zero;
        }
        if (value >= 18446744073709552000) {
            return base.Uint64.max;
        }
        if (value < 0) {
            return base.Uint64.create(-value).negate();
        }
        return new base.Uint64((value % 4294967296) | 0, (value / 4294967296));
    }

    get isZero() {
        return this.low === 0 && this.high === 0;
    }

    get isNegative() {
        return false;
    }

    negate() {
        return this.not().add(base.Int64.one);
    }

    not() {
        return new base.Uint64(~this.low, ~this.high);
    }

    equals(other) {
        if (!(other instanceof base.Uint64) && (this.high >>> 31) === 1 && (other.high >>> 31) === 1) {
            return false;
        }
        return this.high === other.high && this.low === other.low;
    }

    compare(other) {
        if (this.equals(other)) {
            return 0;
        }
        const thisNeg = this.isNegative;
        const otherNeg = other.isNegative;
        if (thisNeg && !otherNeg) {
            return -1;
        }
        if (!thisNeg && otherNeg) {
            return 1;
        }
        return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
    }

    add(other) {
        return base.Utility.add(this, other, true);
    }

    subtract(other) {
        return base.Utility.subtract(this, other, true);
    }

    multiply(other) {
        return base.Utility.multiply(this, other, true);
    }

    divide(other) {
        return base.Utility.divide(this, other, true);
    }

    toInteger() {
        return this.low >>> 0;
    }

    toNumber() {
        if (this.high === 0) {
            return this.low >>> 0;
        }
        return ((this.high >>> 0) * 4294967296) + (this.low >>> 0);
    }

    toString(radix) {
        const r = radix || 10;
        if (r < 2 || 36 < r) {
            throw new RangeError('radix');
        }
        if (this.isZero) {
            return '0';
        }
        if (this.high === 0) {
            return this.low.toString(radix);
        }
        return base.Utility.text(this, true, r);
    }
};

base.Utility = class {

    static add(a, b, unsigned) {
        const a48 = a.high >>> 16;
        const a32 = a.high & 0xFFFF;
        const a16 = a.low >>> 16;
        const a00 = a.low & 0xFFFF;
        const b48 = b.high >>> 16;
        const b32 = b.high & 0xFFFF;
        const b16 = b.low >>> 16;
        const b00 = b.low & 0xFFFF;
        let c48 = 0;
        let c32 = 0;
        let c16 = 0;
        let c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return base.Utility._create((c16 << 16) | c00, (c48 << 16) | c32, unsigned);
    }

    static subtract(a, b, unsigned) {
        return base.Utility.add(a, b.negate(), unsigned);
    }

    static multiply(a, b, unsigned) {
        if (a.isZero) {
            return base.Int64.zero;
        }
        if (b.isZero) {
            return base.Int64.zero;
        }
        if (a.equals(base.Int64.min)) {
            return b.isOdd() ? base.Int64.min : base.Int64.zero;
        }
        if (b.equals(base.Int64.min)) {
            return b.isOdd() ? base.Int64.min : base.Int64.zero;
        }
        if (a.isNegative) {
            if (b.isNegative) {
                return this.negate().multiply(b.negate());
            }
            return this.negate().multiply(b).negate();
        }
        else if (b.isNegative) {
            return this.multiply(b.negate()).negate();
        }
        if (a.compare(base.Int64.power24) < 0 && b.compare(base.Int64.power24) < 0) {
            return unsigned ? base.Uint64.create(a.toNumber() * b.toNumber()) : base.Int64.create(a.toNumber() * b.toNumber());
        }
        const a48 = a.high >>> 16;
        const a32 = a.high & 0xFFFF;
        const a16 = a.low >>> 16;
        const a00 = a.low & 0xFFFF;
        const b48 = b.high >>> 16;
        const b32 = b.high & 0xFFFF;
        const b16 = b.low >>> 16;
        const b00 = b.low & 0xFFFF;
        let c48 = 0;
        let c32 = 0;
        let c16 = 0;
        let c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return base.Utility._create((c16 << 16) | c00, (c48 << 16) | c32, unsigned);
    }

    static divide(a, b, unsigned) {
        if (b.isZero) {
            throw new Error('Division by zero.');
        }
        if (a.isZero) {
            return unsigned ? base.Uint64.zero : base.Int64.zero;
        }
        let approx;
        let remainder;
        let result;
        if (!unsigned) {
            if (a.equals(base.Int64.min)) {
                if (b.equals(base.Int64.one) || b.equals(base.Int64.negativeOne)) {
                    return base.Int64.min;
                }
                else if (b.equals(base.Int64.min)) {
                    return base.Int64.one;
                }
                const half = base.Utility._shiftRight(a, unsigned, 1);
                const halfDivide = half.divide(b);
                approx = base.Utility._shiftLeft(halfDivide, halfDivide instanceof base.Uint64, 1);
                if (approx.eq(base.Int64.zero)) {
                    return b.isNegative ? base.Int64.one : base.Int64.negativeOne;
                }
                remainder = a.subtract(b.multiply(approx));
                result = approx.add(remainder.divide(b));
                return result;
            }
            else if (b.equals(base.Int64.min)) {
                return unsigned ? base.Uint64.zero : base.Int64.zero;
            }
            if (a.isNegative) {
                if (b.isNegative) {
                    return this.negate().divide(b.negate());
                }
                return a.negate().divide(b).negate();
            }
            else if (b.isNegative) {
                return a.divide(b.negate()).negate();
            }
            result = base.Int64.zero;
        }
        else {
            if (!(b instanceof base.Uint64)) {
                b = new base.Uint64(b.low, b.high);
            }
            if (b.compare(a) > 0) {
                return base.Int64.zero;
            }
            if (b.compare(base.Utility._shiftRight(a, unsigned, 1)) > 0) {
                return base.Uint64.one;
            }
            result = base.Uint64.zero;
        }
        remainder = a;
        while (remainder.compare(b) >= 0) {
            let approx = Math.max(1, Math.floor(remainder.toNumber() / b.toNumber()));
            const log2 = Math.ceil(Math.log(approx) / Math.LN2);
            const delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
            let approxResult = base.Int64.create(approx);
            let approxRemainder = approxResult.multiply(b);
            while (approxRemainder.isNegative || approxRemainder.compare(remainder) > 0) {
                approx -= delta;
                approxResult = unsigned ? base.Uint64.create(approx) : base.Int64.create(approx);
                approxRemainder = approxResult.multiply(b);
            }
            if (approxResult.isZero) {
                approxResult = base.Int64.one;
            }
            result = result.add(approxResult);
            remainder = remainder.subtract(approxRemainder);
        }
        return result;
    }

    static text(value, unsigned, radix) {
        const power = unsigned ? base.Uint64.create(Math.pow(radix, 6)) : base.Int64.create(Math.pow(radix, 6));
        let remainder = value;
        let result = '';
        for (;;) {
            const remainderDiv = remainder.divide(power);
            const intval = remainder.subtract(remainderDiv.multiply(power)).toInteger() >>> 0;
            let digits = intval.toString(radix);
            remainder = remainderDiv;
            if (remainder.low === 0 && remainder.high === 0) {
                return digits + result;
            }
            while (digits.length < 6) {
                digits = '0' + digits;
            }
            result = '' + digits + result;
        }
    }

    static _shiftLeft(value, unsigned, shift) {
        return base.Utility._create(value.low << shift, (value.high << shift) | (value.low >>> (32 - shift)), unsigned);
    }

    static _shiftRight(value, unsigned, shift) {
        return base.Utility._create((value.low >>> shift) | (value.high << (32 - shift)), value.high >> shift, unsigned);
    }

    static _create(low, high, unsigned) {
        return unsigned ? new base.Uint64(low, high) : new base.Int64(low, high);
    }
};

base.Uint64.zero = new base.Uint64(0, 0);
base.Uint64.one = new base.Uint64(1, 0);
base.Uint64.max = new base.Uint64(-1, -1);

base.Complex = class Complex {

    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    static create(real, imaginary) {
        return new base.Complex(real, imaginary);
    }

    toString(/* radix */) {
        return this.real + ' + ' + this.imaginary + 'i';
    }
};

if (!DataView.prototype.getFloat16) {
    DataView.prototype.getFloat16 = function(byteOffset, littleEndian) {
        const value = this.getUint16(byteOffset, littleEndian);
        const e = (value & 0x7C00) >> 10;
        let f = value & 0x03FF;
        if (e == 0) {
            f = 0.00006103515625 * (f / 1024);
        }
        else if (e == 0x1F) {
            f = f ? NaN : Infinity;
        }
        else {
            f = DataView.__float16_pow[e] * (1 + (f / 1024));
        }
        return value & 0x8000 ? -f : f;
    };
    DataView.__float16_pow = {
        1: 1/16384, 2: 1/8192, 3: 1/4096, 4: 1/2048, 5: 1/1024, 6: 1/512, 7: 1/256, 8: 1/128,
        9: 1/64, 10: 1/32, 11: 1/16, 12: 1/8, 13: 1/4, 14: 1/2, 15: 1, 16: 2,
        17: 4, 18: 8, 19: 16, 20: 32, 21: 64, 22: 128, 23: 256, 24: 512,
        25: 1024, 26: 2048, 27: 4096, 28: 8192, 29: 16384, 30: 32768, 31: 65536
    };
}

if (!DataView.prototype.setFloat16) {
    DataView.prototype.setFloat16 = function(byteOffset, value, littleEndian) {
        DataView.__float16_float[0] = value;
        value = DataView.__float16_int[0];
        const s = (value >>> 16) & 0x8000;
        const e = (value >>> 23) & 0xff;
        const f = value & 0x7fffff;
        const v = s | DataView.__float16_base[e] | (f >> DataView.__float16_shift[e]);
        this.setUint16(byteOffset, v, littleEndian);
    };
    DataView.__float16_float = new Float32Array(1);
    DataView.__float16_int = new Uint32Array(DataView.__float16_float.buffer, 0, DataView.__float16_float.length);
    DataView.__float16_base = new Uint32Array(256);
    DataView.__float16_shift = new Uint32Array(256);
    for (let i = 0; i < 256; ++i) {
        const e = i - 127;
        if (e < -27) {
            DataView.__float16_base[i] = 0x0000;
            DataView.__float16_shift[i] = 24;
        }
        else if (e < -14) {
            DataView.__float16_base[i] = 0x0400 >> -e - 14;
            DataView.__float16_shift[i] = -e - 1;
        }
        else if (e <= 15) {
            DataView.__float16_base[i] = e + 15 << 10;
            DataView.__float16_shift[i] = 13;
        }
        else if (e < 128) {
            DataView.__float16_base[i] = 0x7c00;
            DataView.__float16_shift[i] = 24;
        }
        else {
            DataView.__float16_base[i] = 0x7c00;
            DataView.__float16_shift[i] = 13;
        }
    }
}

if (!DataView.prototype.getBfloat16) {
    DataView.prototype.getBfloat16 = function(byteOffset, littleEndian) {
        if (littleEndian) {
            DataView.__bfloat16_get_uint16_le[1] = this.getUint16(byteOffset, littleEndian);
            return DataView.__bfloat16_get_float32_le[0];
        }
        DataView.__bfloat16_uint16_be[0] = this.getUint16(byteOffset, littleEndian);
        return DataView.__bfloat16_get_float32_be[0];
    };
    DataView.__bfloat16_get_float32_le = new Float32Array(1);
    DataView.__bfloat16_get_float32_be = new Float32Array(1);
    DataView.__bfloat16_get_uint16_le = new Uint16Array(DataView.__bfloat16_get_float32_le.buffer, DataView.__bfloat16_get_float32_le.byteOffset, 2);
    DataView.__bfloat16_get_uint16_be = new Uint16Array(DataView.__bfloat16_get_float32_be.buffer, DataView.__bfloat16_get_float32_be.byteOffset, 2);
}

DataView.prototype.getInt64 = DataView.prototype.getInt64 || function(byteOffset, littleEndian) {
    return littleEndian ?
        new base.Int64(this.getUint32(byteOffset, true), this.getUint32(byteOffset + 4, true)) :
        new base.Int64(this.getUint32(byteOffset + 4, true), this.getUint32(byteOffset, true));
};

DataView.prototype.setInt64 = DataView.prototype.setInt64 || function(byteOffset, value, littleEndian) {
    if (littleEndian) {
        this.setUint32(byteOffset, value.low, true);
        this.setUint32(byteOffset + 4, value.high, true);
    }
    else {
        this.setUint32(byteOffset + 4, value.low, false);
        this.setUint32(byteOffset, value.high, false);
    }
};

DataView.prototype.getIntBits = DataView.prototype.getUintBits || function(offset, bits) {
    offset = offset * bits;
    const available = (this.byteLength << 3) - offset;
    if (bits > available) {
        throw new RangeError();
    }
    let value = 0;
    let index = 0;
    while (index < bits) {
        const remainder = offset & 7;
        const size = Math.min(bits - index, 8 - remainder);
        value <<= size;
        value |= (this.getUint8(offset >> 3) >> (8 - size - remainder)) & ~(0xff << size);
        offset += size;
        index += size;
    }
    return (value < (2 << (bits - 1)) ? value : (2 << bits));
};

DataView.prototype.getUint64 = DataView.prototype.getUint64 || function(byteOffset, littleEndian) {
    return littleEndian ?
        new base.Uint64(this.getUint32(byteOffset, true), this.getUint32(byteOffset + 4, true)) :
        new base.Uint64(this.getUint32(byteOffset + 4, true), this.getUint32(byteOffset, true));
};

DataView.prototype.setUint64 = DataView.prototype.setUint64 || function(byteOffset, value, littleEndian) {
    if (littleEndian) {
        this.setUint32(byteOffset, value.low, true);
        this.setUint32(byteOffset + 4, value.high, true);
    }
    else {
        this.setUint32(byteOffset + 4, value.low, false);
        this.setUint32(byteOffset, value.high, false);
    }
};

DataView.prototype.getUintBits = DataView.prototype.getUintBits || function(offset, bits) {
    offset = offset * bits;
    const available = (this.byteLength << 3) - offset;
    if (bits > available) {
        throw new RangeError();
    }
    let value = 0;
    let index = 0;
    while (index < bits) {
        const remainder = offset & 7;
        const size = Math.min(bits - index, 8 - remainder);
        value <<= size;
        value |= (this.getUint8(offset >> 3) >> (8 - size - remainder)) & ~(0xff << size);
        offset += size;
        index += size;
    }
    return value;
};

DataView.prototype.getComplex64 = DataView.prototype.getComplex64 || function(byteOffset, littleEndian) {
    const real = littleEndian ? this.getFloat32(byteOffset, littleEndian) : this.getFloat32(byteOffset + 4, littleEndian);
    const imaginary = littleEndian ? this.getFloat32(byteOffset + 4, littleEndian) : this.getFloat32(byteOffset, littleEndian);
    return base.Complex.create(real, imaginary);
};

DataView.prototype.setComplex64 = DataView.prototype.setComplex64 || function(byteOffset, value, littleEndian) {
    if (littleEndian) {
        this.setFloat32(byteOffset, value.real, littleEndian);
        this.setFloat32(byteOffset + 4, value.imaginary, littleEndian);
    }
    else {
        this.setFloat32(byteOffset + 4, value.real, littleEndian);
        this.setFloat32(byteOffset, value.imaginary, littleEndian);
    }
};

DataView.prototype.getComplex128 = DataView.prototype.getComplex128 || function(byteOffset, littleEndian) {
    const real = littleEndian ? this.getFloat64(byteOffset, littleEndian) : this.getFloat64(byteOffset + 8, littleEndian);
    const imaginary = littleEndian ? this.getFloat64(byteOffset + 8, littleEndian) : this.getFloat64(byteOffset, littleEndian);
    return base.Complex.create(real, imaginary);
};

DataView.prototype.setComplex128 = DataView.prototype.setComplex128 || function(byteOffset, value, littleEndian) {
    if (littleEndian) {
        this.setFloat64(byteOffset, value.real, littleEndian);
        this.setFloat64(byteOffset + 8, value.imaginary, littleEndian);
    }
    else {
        this.setFloat64(byteOffset + 8, value.real, littleEndian);
        this.setFloat64(byteOffset, value.imaginary, littleEndian);
    }
};

base.BinaryReader = class {

    constructor(data) {
        this._buffer = data instanceof Uint8Array ? data : data.peek();
        this._position = 0;
        this._length = this._buffer.length;
        this._view = new DataView(this._buffer.buffer, this._buffer.byteOffset, this._buffer.byteLength);
    }

    get length() {
        return this._length;
    }

    get position() {
        return this._position;
    }

    seek(position) {
        this._position = position >= 0 ? position : this._length + position;
        if (this._position > this._length || this._position < 0) {
            throw new Error('Expected ' + (this._position - this._length) + ' more bytes. The file might be corrupted. Unexpected end of file.');
        }
    }

    skip(offset) {
        this._position += offset;
        if (this._position > this._length) {
            throw new Error('Expected ' + (this._position - this._length) + ' more bytes. The file might be corrupted. Unexpected end of file.');
        }
    }

    align(mod) {
        if (this._position % mod != 0) {
            this.skip(mod - (this._position % mod));
        }
    }

    peek(length) {
        if (this._position === 0 && length === undefined) {
            return this._buffer;
        }
        const position = this._position;
        this.skip(length !== undefined ? length : this._length - this._position);
        const end = this._position;
        this._position = position;
        return this._buffer.slice(position, end);
    }

    read(length) {
        if (this._position === 0 && length === undefined) {
            this._position = this._length;
            return this._buffer;
        }
        const position = this._position;
        this.skip(length !== undefined ? length : this._length - this._position);
        return this._buffer.slice(position, this._position);
    }

    byte() {
        const position = this._position;
        this.skip(1);
        return this._buffer[position];
    }

    int8() {
        const position = this._position;
        this.skip(1);
        return this._view.getInt8(position, true);
    }

    int16() {
        const position = this._position;
        this.skip(2);
        return this._view.getInt16(position, true);
    }

    int32() {
        const position = this._position;
        this.skip(4);
        return this._view.getInt32(position, true);
    }

    int64() {
        const position = this._position;
        this.skip(8);
        return this._view.getInt64(position, true).toNumber();
    }

    uint16() {
        const position = this._position;
        this.skip(2);
        return this._view.getUint16(position, true);
    }

    uint32() {
        const position = this._position;
        this.skip(4);
        return this._view.getUint32(position, true);
    }

    uint64() {
        const position = this._position;
        this.skip(8);
        const low = this._view.getUint32(position, true);
        const high = this._view.getUint32(position + 4, true);
        if (high === 0) {
            return low;
        }
        const value = (high * 4294967296) + low;
        if (Number.isSafeInteger(value)) {
            return value;
        }
        throw new Error("Unsigned 64-bit value exceeds safe integer.");
    }

    float32() {
        const position = this._position;
        this.skip(4);
        return this._view.getFloat32(position, true);
    }

    float64() {
        const position = this._position;
        this.skip(8);
        return this._view.getFloat64(position, true);
    }

    string() {
        const length = this.uint32();
        const position = this._position;
        this.skip(length);
        const data = this._buffer.subarray(position, this._position);
        this._decoder = this._decoder || new TextDecoder('utf-8');
        return this._decoder.decode(data);
    }

    boolean() {
        return this.byte() !== 0 ? true : false;
    }
};

base.Metadata = class {

    static open(context, name) {
        base.Metadata._metadata = base.Metadata._metadata || new Map();
        if (base.Metadata._metadata.has(name)) {
            return Promise.resolve(base.Metadata._metadata.get(name));
        }
        return context.request(name, 'utf-8', null).then((data) => {
            const library = new base.Metadata(data);
            base.Metadata._metadata.set(name, library);
            return library;
        }).catch(() => {
            const library = new base.Metadata(null);
            base.Metadata._metadata.set(name, library);
            return library;
        });
    }

    constructor(data) {
        this._types = new Map();
        this._attributes = new Map();
        if (data) {
            const metadata = JSON.parse(data);
            for (const entry of metadata) {
                this._types.set(entry.name, entry);
                if (entry.identifier !== undefined) {
                    this._types.set(entry.identifier, entry);
                }
            }
        }
    }

    type(name) {
        if (!this._types.has(name)) {
            this._types.set(name, { name: name.toString() });
        }
        return this._types.get(name);
    }

    attribute(type, name) {
        const key = type + ':' + name;
        if (!this._attributes.has(key)) {
            this._attributes.set(key, null);
            const metadata = this.type(type);
            if (metadata && Array.isArray(metadata.attributes)) {
                for (const attribute of metadata.attributes) {
                    this._attributes.set(type + ':' + attribute.name, attribute);
                }
            }
        }
        return this._attributes.get(key);
    }
};

if (typeof window !== 'undefined' && typeof window.Long != 'undefined') {
    window.long = { Long: window.Long };
    window.Int64 = base.Int64;
    window.Uint64 = base.Uint64;
}

if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    module.exports.Int64 = base.Int64;
    module.exports.Uint64 = base.Uint64;
    module.exports.Complex64 = base.Complex;
    module.exports.Complex128 = base.Complex;
    module.exports.BinaryReader = base.BinaryReader;
    module.exports.Metadata = base.Metadata;
}

//// text.js

var text = text || {};

text.Decoder = class {

    static open(data, encoding) {
        if (typeof data === 'string') {
            return new text.Decoder.String(data);
        }
        const assert = (encoding, condition) => {
            if (encoding && encoding !== condition) {
                throw new text.Error("Invalid encoding '" + encoding + "'.");
            }
        };
        const buffer = data instanceof Uint8Array ? data : data.peek();
        const length = buffer.length;
        if (length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
            assert(encoding, 'utf-8');
            return new text.Decoder.Utf8(buffer, 3, true);
        }
        if (length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
            assert(encoding, 'utf-16');
            return new text.Decoder.Utf16LE(buffer, 2);
        }
        if (length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
            assert(encoding, 'utf-16');
            return new text.Decoder.Utf16BE(buffer, 2);
        }
        if (length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xfe && buffer[3] === 0xff) {
            assert(encoding, 'utf-32');
            return new text.Decoder.Utf32LE(buffer, 2);
        }
        if (length >= 4 && buffer[0] === 0xff && buffer[1] === 0xfe && buffer[2] === 0x00 && buffer[3] === 0x00) {
            assert(encoding, 'utf-32');
            return new text.Decoder.Utf32BE(buffer, 2);
        }
        if (length >= 5 && buffer[0] === 0x2B && buffer[1] === 0x2F && buffer[2] === 0x76 && buffer[3] === 0x38 && buffer[4] === 0x2D) {
            throw new text.Error("Unsupported UTF-7 encoding.");
        }
        if (length >= 4 && buffer[0] === 0x2B && buffer[1] === 0x2F && buffer[2] === 0x76 && (buffer[3] === 0x38 || buffer[3] === 0x39 || buffer[3] === 0x2B || buffer[3] === 0x2F)) {
            throw new text.Error("Unsupported UTF-7 encoding.");
        }
        if (length >= 4 && buffer[0] === 0x84 && buffer[1] === 0x31 && buffer[2] === 0x95 && buffer[3] === 0x33) {
            throw new text.Error("Unsupported GB-18030 encoding.");
        }
        if (length > 4 && (length % 2) == 0 && (buffer[0] === 0x00 || buffer[1] === 0x00 || buffer[2] === 0x00 || buffer[3] === 0x00)) {
            const lo = new Uint32Array(256);
            const hi = new Uint32Array(256);
            for (let i = 0; i < length; i += 2) {
                lo[buffer[i]]++;
                hi[buffer[i + 1]]++;
            }
            if (lo[0x00] === 0 && (hi[0x00] / (length >> 1)) > 0.5) {
                assert(encoding, 'utf-16');
                return new text.Decoder.Utf16LE(buffer, 0);
            }
            if (hi[0x00] === 0 && (lo[0x00] / (length >> 1)) > 0.5) {
                assert(encoding, 'utf-16');
                return new text.Decoder.Utf16BE(buffer, 0);
            }
        }
        if (encoding && (encoding.startsWith('iso-8859-') || encoding.startsWith('latin-'))) {
            return new text.Decoder.Latin1(buffer, 0);
        }
        assert(encoding, 'utf-8');
        return new text.Decoder.Utf8(buffer, 0, encoding === 'utf-8');
    }
};

text.Decoder.String = class {

    constructor(buffer) {
        this.buffer = buffer ? buffer.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) : [];
        this.position = 0;
        this.length = this.buffer.length;
    }

    get encoding() {
        return null;
    }

    decode() {
        if (this.position < this.length) {
            return this.buffer[this.position++];
        }
        return undefined;
    }
};

text.Decoder.Utf8 = class {

    constructor(buffer, position, fatal) {
        this.position = position || 0;
        this.buffer = buffer;
        this.fatal = fatal;
    }

    get encoding() {
        return 'utf-8';
    }

    decode() {
        const c = this.buffer[this.position];
        if (c === undefined) {
            return c;
        }
        this.position++;
        if (c < 0x80) {
            return String.fromCodePoint(c);
        }
        if (c >= 0xC2 && c <= 0xDF) {
            if (this.buffer[this.position] !== undefined) {
                const c2 = this.buffer[this.position];
                this.position++;
                return String.fromCharCode(((c & 0x1F) << 6) | (c2 & 0x3F));
            }
        }
        if (c >= 0xE0 && c <= 0xEF) {
            if (this.buffer[this.position + 1] !== undefined) {
                const c2 = this.buffer[this.position];
                if ((c !== 0xE0 || c2 >= 0xA0) && (c !== 0xED || c2 <= 0x9f)) {
                    const c3 = this.buffer[this.position + 1];
                    if (c3 >= 0x80 && c3 < 0xFB) {
                        this.position += 2;
                        return String.fromCharCode(((c & 0x0F) << 12) | ((c2 & 0x3F) << 6) | ((c3 & 0x3F) << 0));
                    }
                }
            }
        }
        if (c >= 0xF0 && c <= 0xF4) {
            if (this.buffer[this.position + 2] !== undefined) {
                const c2 = this.buffer[this.position];
                if (c2 >= 0x80 && c2 <= 0xBF) {
                    const c3 = this.buffer[this.position + 1];
                    if (c3 >= 0x80 && c3 <= 0xBF) {
                        const c4 = this.buffer[this.position + 2];
                        if (c4 >= 0x80 && c4 <= 0xBF) {
                            const codePoint = ((c & 0x07) << 18) | ((c2 & 0x3F) << 12) | ((c3 & 0x3F) << 6) | (c4 & 0x3F);
                            if (codePoint <= 0x10FFFF) {
                                this.position += 3;
                                return String.fromCodePoint(codePoint);
                            }
                        }
                    }
                }
            }
        }
        if (this.fatal) {
            throw new text.Error('Invalid utf-8 character.');
        }
        return String.fromCharCode(0xfffd);
    }
};

text.Decoder.Latin1 = class {

    constructor(buffer, position) {
        this.position = position || 0;
        this.buffer = buffer;
    }

    get encoding() {
        return 'latin-1';
    }

    decode() {
        const c = this.buffer[this.position];
        if (c === undefined) {
            return c;
        }
        this.position++;
        return String.fromCodePoint(c);
    }
};

text.Decoder.Utf16LE = class {

    constructor(buffer, position) {
        this.buffer = buffer;
        this.position = position || 0;
        this.length = buffer.length;
    }

    get encoding() {
        return 'utf-16';
    }

    decode() {
        if (this.position + 1 < this.length) {
            const c = this.buffer[this.position++] | (this.buffer[this.position++] << 8);
            if (c < 0xD800 || c >= 0xDFFF) {
                return String.fromCharCode(c);
            }
            if (c >= 0xD800 && c < 0xDBFF) {
                if (this._position + 1 < this._length) {
                    const c2 = this._buffer[this._position++] | (this._buffer[this._position++] << 8);
                    if (c >= 0xDC00 || c < 0xDFFF) {
                        return String.fromCodePoint(0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff));
                    }
                }
            }
            return String.fromCharCode(0xfffd);
        }
        return undefined;
    }
};

text.Decoder.Utf16BE = class {

    constructor(buffer, position) {
        this.buffer = buffer;
        this.position = position || 0;
        this.length = buffer.length;
    }

    get encoding() {
        return 'utf-16';
    }

    decode() {
        if (this.position + 1 < this.length) {
            const c = (this.buffer[this.position++] << 8) | this.buffer[this.position++];
            if (c < 0xD800 || c >= 0xDFFF) {
                return String.fromCharCode(c);
            }
            if (c >= 0xD800 && c < 0xDBFF) {
                if (this._position + 1 < this._length) {
                    const c2 = (this._buffer[this._position++] << 8) | this._buffer[this._position++];
                    if (c >= 0xDC00 || c < 0xDFFF) {
                        return String.fromCodePoint(0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff));
                    }
                }
            }
            return String.fromCharCode(0xfffd);
        }
        return undefined;
    }
};

text.Decoder.Utf32LE = class {

    constructor(buffer, position) {
        this.buffer = buffer;
        this.position = position || 0;
        this.length = buffer.length;
    }

    get encoding() {
        return 'utf-32';
    }

    decode() {
        if (this.position + 3 < this.length) {
            const c = this.buffer[this.position++] | (this.buffer[this.position++] << 8) || (this.buffer[this.position++] << 16) || (this.buffer[this.position++] << 24);
            if (c < 0x10FFFF) {
                return String.fromCodePoint(c);
            }
            return String.fromCharCode(0xfffd);
        }
        return undefined;
    }
};

text.Decoder.Utf32BE = class {

    constructor(buffer, position) {
        this.buffer = buffer;
        this.position = position || 0;
        this.length = buffer.length;
    }

    get encoding() {
        return 'utf-32';
    }

    decode() {
        if (this.position + 3 < this.length) {
            const c = (this.buffer[this.position++] << 24) || (this.buffer[this.position++] << 16) || (this.buffer[this.position++] << 8) | this.buffer[this.position++];
            if (c < 0x10FFFF) {
                return String.fromCodePoint(c);
            }
            return String.fromCharCode(0xfffd);
        }
        return undefined;
    }
};

text.Reader = class {

    constructor(data, length) {
        this._decoder = text.Decoder.open(data);
        this._position = 0;
        this._length = length || Number.MAX_SAFE_INTEGER;
    }

    static open(data, length) {
        return new text.Reader(data, length);
    }

    read() {
        if (this._position >= this._length) {
            return undefined;
        }
        let line = '';
        let buffer = null;
        for (;;) {
            const c = this._decoder.decode();
            if (c === undefined) {
                this._length = this._position;
                break;
            }
            this._position++;
            if (this._position > this._length) {
                break;
            }
            if (c === '\n') {
                break;
            }
            line += c;
            if (line.length >= 32) {
                buffer = buffer || [];
                buffer.push(line);
                line = '';
            }
        }
        if (buffer) {
            buffer.push(line);
            return buffer.join('');
        }
        return line;
    }
};

text.Error = class extends Error {

    constructor(message) {
        super(message);
        this.name = 'Text Error';
    }
};

if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    module.exports.Decoder = text.Decoder;
    module.exports.Reader = text.Reader;
}


//// protobuf.js
var protobuf = protobuf || {};

// Both variables are defined earlier in this file.
// var base = base || require('./base');
// var text = text || require('./text');

protobuf.get = (name) => {
    protobuf._map = protobuf._map || new Map();
    if (!protobuf._map.has(name)) {
        protobuf._map.set(name, {});
    }
    return protobuf._map.get(name);
};

protobuf.BinaryReader = class {

    static open(data) {
        return data ? new protobuf.BinaryReader(data) : null;
    }

    constructor(data) {
        const buffer = data instanceof Uint8Array ? data : data.peek();
        this._buffer = buffer;
        this._length = buffer.length;
        this._position = 0;
        this._view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        this._utf8Decoder = new TextDecoder('utf-8');
    }

    signature() {
        const tags = new Map();
        this._position = 0;
        try {
            if (this._length > 0) {
                const type = this._buffer[0] & 7;
                if (type !== 4 && type !== 6 && type !== 7) {
                    const length = this.length;
                    while (this._position < length) {
                        const tag = this.uint32();
                        const field = tag >>> 3;
                        const type = tag & 7;
                        if (type > 5 || field === 0) {
                            tags.clear();
                            break;
                        }
                        tags.set(field, type);
                        if (!this._skipType(type)) {
                            tags.clear();
                            break;
                        }
                    }
                }
            }
        }
        catch (err) {
            tags.clear();
        }
        this._position = 0;
        return tags;
    }

    decode() {
        let tags = {};
        this._position = 0;
        try {
            const decodeMessage = (max) => {
                const length = this._uint32();
                if (length === undefined) {
                    return undefined;
                }
                if (length === 0) {
                    // return 2;
                }
                const end = this.position + length;
                if (end > max) {
                    return undefined;
                }
                try {
                    const tags = {};
                    while (this.position < end) {
                        const tag = this._uint32();
                        if (tag === undefined) {
                            this.seek(end);
                            return 2;
                        }
                        const field = tag >>> 3;
                        const type = tag & 7;
                        if (type > 5 || field === 0) {
                            this.seek(end);
                            return 2;
                        }
                        if (type === 2) {
                            const type = tags[field];
                            if (type !== 2) {
                                const inner = decodeMessage(end);
                                if (this.position > end) {
                                    this.seek(end);
                                    return 2;
                                }
                                if (inner === undefined) {
                                    this.seek(end);
                                    return 2;
                                }
                                if (inner === 2) {
                                    tags[field] = inner;
                                }
                                else if (!type) {
                                    tags[field] = inner;
                                }
                                else {
                                    for (const pair of Object.entries(inner)) {
                                        if (type[pair[0]] === 2 && pair[1] !== 2) {
                                            continue;
                                        }
                                        type[pair[0]] = pair[1];
                                    }
                                }
                                continue;
                            }
                        }
                        tags[field] = type;
                        if (!this._skipType(type)) {
                            this.seek(end);
                            return 2;
                        }
                    }
                    if (this.position === end) {
                        return tags;
                    }
                }
                catch (err) {
                    // continue regardless of error
                }
                this.seek(end);
                return 2;
            };
            if (this._length > 0) {
                const type = this._buffer[0] & 7;
                if (type !== 4 && type !== 6 && type !== 7) {
                    const length = this.length;
                    while (this.position < length) {
                        const tag = this.uint32();
                        const field = tag >>> 3;
                        const type = tag & 7;
                        if (type > 5 || field === 0) {
                            tags = {};
                            break;
                        }
                        if (type === 2) {
                            const type = tags[field];
                            if (type !== 2) {
                                const inner = decodeMessage(length);
                                if (inner === undefined) {
                                    tags = {};
                                    break;
                                }
                                if (inner === 2) {
                                    tags[field] = inner;
                                }
                                else if (!type) {
                                    tags[field] = inner;
                                }
                                else {
                                    for (const pair of Object.entries(inner)) {
                                        if (type[pair[0]] === 2 && pair[1] !== 2) {
                                            continue;
                                        }
                                        type[pair[0]] = pair[1];
                                    }
                                }
                                continue;
                            }
                        }
                        tags[field] = type;
                        if (!this._skipType(type)) {
                            tags = {};
                            break;
                        }
                    }
                }
            }
        }
        catch (err) {
            tags = {};
        }
        this._position = 0;
        return tags;
    }

    get length() {
        return this._length;
    }

    get position() {
        return this._position;
    }

    seek(position) {
        this._position = position >= 0 ? position : this._length + position;
    }

    string() {
        return this._utf8Decoder.decode(this.bytes());
    }

    bool() {
        return this.uint32() !== 0;
    }

    byte() {
        if (this._position < this._length) {
            return this._buffer[this._position++];
        }
        throw new RangeError('Unexpected end of file.');
    }

    bytes() {
        const length = this.uint32();
        const position = this._position;
        this.skip(length);
        return this._buffer.slice(position, this._position);
    }

    uint32() {
        let c;
        c = this.byte();
        let value = (c & 127) >>> 0;
        if (c < 128) {
            return value;
        }
        c = this.byte();
        value = (value | (c & 127) <<  7) >>> 0;
        if (c < 128) {
            return value;
        }
        c = this.byte();
        value = (value | (c & 127) << 14) >>> 0;
        if (c < 128) {
            return value;
        }
        c = this.byte();
        value = (value | (c & 127) << 21) >>> 0;
        if (c < 128) {
            return value;
        }
        c = this.byte();
        value = (value | (c & 15) << 28) >>> 0;
        if (c < 128) {
            return value;
        }
        if (this.byte() !== 255 || this.byte() !== 255 || this.byte() !== 255 || this.byte() !== 255 || this.byte() !== 1) {
            throw new protobuf.Error('Varint is not 32-bit.');
        }
        return value;
    }

    int32() {
        return this.uint32() | 0;
    }

    sint32() {
        const value = this.uint32();
        return value >>> 1 ^ -(value & 1) | 0;
    }

    int64() {
        return this._varint().toInt64();
    }

    uint64() {
        return this._varint().toInt64();
    }

    sint64() {
        return this._varint().zzDecode().toInt64();
    }

    fixed64() {
        const position = this._position;
        this.skip(8);
        return this._view.getUint64(position, true);
    }

    sfixed64() {
        const position = this._position;
        this.skip(8);
        return this._view.getInt64(position, true);
    }

    fixed32() {
        const position = this._position;
        this.skip(4);
        return this._view.getUint32(position, true);
    }

    sfixed32() {
        const position = this._position;
        this.skip(4);
        return this._view.getInt32(position, true);
    }

    float() {
        const position = this._position;
        this.skip(4);
        return this._view.getFloat32(position, true);
    }

    double() {
        const position = this._position;
        this.skip(8);
        return this._view.getFloat64(position, true);
    }

    array(obj, item, tag) {
        if ((tag & 7) === 2) {
            const end = this.uint32() + this._position;
            while (this._position < end) {
                obj.push(item());
            }
        }
        else {
            obj.push(item());
        }
        return obj;
    }

    floats(obj, tag) {
        if ((tag & 7) === 2) {
            if (obj && obj.length > 0) {
                throw new protobuf.Error('Invalid packed float array.');
            }
            const size = this.uint32();
            const end = this._position + size;
            if (end > this._length) {
                this._unexpected();
            }
            const length = size >>> 2;
            obj = size > 1048576 ? new Float32Array(length) : new Array(length);
            let position = this._position;
            for (let i = 0; i < length; i++) {
                obj[i] = this._view.getFloat32(position, true);
                position += 4;
            }
            this._position = end;
        }
        else if (obj !== undefined && obj.length < 1000000) {
            obj.push(this.float());
        }
        else {
            obj = undefined;
            this.float();
        }
        return obj;
    }

    doubles(obj, tag) {
        if ((tag & 7) === 2) {
            if (obj && obj.length > 0) {
                throw new protobuf.Error('Invalid packed float array.');
            }
            const size = this.uint32();
            const end = this._position + size;
            if (end > this._length) {
                this._unexpected();
            }
            const length = size >>> 3;
            obj = size > 1048576 ? new Float64Array(length) : new Array(length);
            let position = this._position;
            for (let i = 0; i < length; i++) {
                obj[i] = this._view.getFloat64(position, true);
                position += 8;
            }
            this._position = end;
        }
        else if (obj !== undefined && obj.length < 1000000) {
            obj.push(this.double());
        }
        else {
            obj = undefined;
            this.double();
        }
        return obj;
    }

    skip(offset) {
        this._position += offset;
        if (this._position > this._length) {
            this._unexpected();
        }
    }

    skipVarint() {
        do {
            if (this._position >= this._length) {
                this._unexpected();
            }
        }
        while (this._buffer[this._position++] & 128);
    }

    _uint32() {
        if (this._position < this._length) {
            let c = this._buffer[this._position++];
            let value = (c & 127) >>> 0;
            if (c < 128) {
                return value;
            }
            if (this._position < this._length) {
                c = this._buffer[this._position++];
                value = (value | (c & 127) << 7) >>> 0;
                if (c < 128) {
                    return value;
                }
                if (this._position < this._length) {
                    c = this._buffer[this._position++];
                    value = (value | (c & 127) << 14) >>> 0;
                    if (c < 128) {
                        return value;
                    }
                    if (this._position < this._length) {
                        c = this._buffer[this._position++];
                        value = (value | (c & 127) << 21) >>> 0;
                        if (c < 128) {
                            return value;
                        }
                        if (this._position < this._length) {
                            c = this._buffer[this._position++];
                            value = (value | (c & 15) << 28) >>> 0;
                            if (c < 128) {
                                return value;
                            }
                            if (this.byte() !== 255 || this.byte() !== 255 || this.byte() !== 255 || this.byte() !== 255 || this.byte() !== 1) {
                                return undefined;
                            }
                            return value;
                        }
                    }
                }
            }
        }
        return undefined;
    }

    _skipType(wireType) {
        switch (wireType) {
            case 0: {
                // const max = this._position + 9;
                do {
                    if (this._position >= this._length /* || this._position > max */) {
                        return false;
                    }
                }
                while (this._buffer[this._position++] & 128);
                break;
            }
            case 1: {
                if (this._position + 8 >= this._length) {
                    return false;
                }
                this._position += 8;
                break;
            }
            case 2: {
                const length = this._uint32();
                if (length === undefined) {
                    return false;
                }
                if (this._position + length > this._end) {
                    return false;
                }
                this._position += length;
                break;
            }
            case 3: {
                for (;;) {
                    const tag = this._uint32();
                    if (tag === undefined) {
                        return false;
                    }
                    const wireType = tag & 7;
                    if (wireType === 4) {
                        break;
                    }
                    if (!this._skipType(wireType)) {
                        return false;
                    }
                }
                break;
            }
            case 5: {
                this._position += 4;
                if (this._position > this._length) {
                    return false;
                }
                break;
            }
            default: {
                return false;
            }
        }
        return true;
    }

    skipType(wireType) {
        switch (wireType) {
            case 0:
                this.skipVarint();
                break;
            case 1:
                this.skip(8);
                break;
            case 2:
                this.skip(this.uint32());
                break;
            case 3:
                while ((wireType = this.uint32() & 7) !== 4) {
                    this.skipType(wireType);
                }
                break;
            case 5:
                this.skip(4);
                break;
            default:
                throw new protobuf.Error('Invalid type ' + wireType + ' at offset ' + this._position + '.');
        }
    }

    entry(obj, key, value) {
        this.skipVarint();
        this._position++;
        let k = key();
        if (!Number.isInteger(k) && typeof k !== 'string') {
            k = k.toNumber();
        }
        this._position++;
        const v = value();
        obj[k] = v;
    }

    _varint() {
        const bits = new protobuf.LongBits(0, 0);
        let i = 0;
        if (this._length - this._position > 4) { // fast route (lo)
            for (; i < 4; ++i) {
                // 1st..4th
                bits.lo = (bits.lo | (this._buffer[this._position] & 127) << i * 7) >>> 0;
                if (this._buffer[this._position++] < 128) {
                    return bits;
                }
            }
            // 5th
            bits.lo = (bits.lo | (this._buffer[this._position] & 127) << 28) >>> 0;
            bits.hi = (bits.hi | (this._buffer[this._position] & 127) >>  4) >>> 0;
            if (this._buffer[this._position++] < 128) {
                return bits;
            }
            i = 0;
        }
        else {
            for (; i < 3; i++) {
                if (this._position >= this._length) {
                    this._unexpected();
                }
                bits.lo = (bits.lo | (this._buffer[this._position] & 127) << i * 7) >>> 0;
                if (this._buffer[this._position++] < 128) {
                    return bits;
                }
            }
            bits.lo = (bits.lo | (this._buffer[this._position++] & 127) << i * 7) >>> 0;
            return bits;
        }
        if (this._length - this._position > 4) {
            for (; i < 5; ++i) {
                bits.hi = (bits.hi | (this._buffer[this._position] & 127) << i * 7 + 3) >>> 0;
                if (this._buffer[this._position++] < 128) {
                    return bits;
                }
            }
        }
        else {
            for (; i < 5; ++i) {
                if (this._position >= this._length) {
                    this._unexpected();
                }
                bits.hi = (bits.hi | (this._buffer[this._position] & 127) << i * 7 + 3) >>> 0;
                if (this._buffer[this._position++] < 128) {
                    return bits;
                }
            }
        }
        throw new protobuf.Error('Invalid varint encoding.');
    }

    _unexpected() {
        throw new RangeError('Unexpected end of file.');
    }
};

protobuf.TextReader = class {

    static open(data) {
        if (data) {
            const buffer = data instanceof Uint8Array ? data : data.peek();
            const decoder = text.Decoder.open(buffer);
            let first = true;
            for (let i = 0; i < 0x100; i++) {
                const c = decoder.decode();
                if (c === undefined) {
                    if (i === 0) {
                        return null;
                    }
                    break;
                }
                if (c === '\0') {
                    return null;
                }
                const whitespace = c === ' ' || c === '\n' || c === '\r' || c === '\t';
                if (c < ' ' && !whitespace) {
                    return null;
                }
                if (first && !whitespace) {
                    first = false;
                    if (c === '#') {
                        let c;
                        do {
                            c = decoder.decode();
                        }
                        while (c !== undefined && c !== '\n');
                        if (c === undefined) {
                            break;
                        }
                        continue;
                    }
                    if (c === '[') {
                        continue;
                    }
                    if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') {
                        continue;
                    }
                    return null;
                }
            }
            return new protobuf.TextReader(buffer);
        }
        return null;
    }

    constructor(buffer) {
        this._decoder = text.Decoder.open(buffer);
        this.reset();
    }

    signature() {
        const tags = new Map();
        this.reset();
        try {
            this.start(false);
            while (!this.end()) {
                const tag = this.tag();
                if (this.token() === '{') {
                    this.start();
                    tags.set(tag, true);
                    while (!this.end()) {
                        const subtag = this.tag();
                        tags.set(tag + '.' + subtag, true);
                        this.skip();
                        this.match(',');
                    }
                }
                else {
                    this.skip();
                    tags.set(tag, true);
                }
            }
        }
        catch (err) {
            // continue regardless of error
        }
        this.reset();
        return tags;
    }

    reset() {
        this._decoder.position = 0;
        this._position = 0;
        this._token = undefined;
        this._depth = 0;
        this._arrayDepth = 0;
        this._token = '';
        this.next();
    }

    start() {
        if (this._depth > 0) {
            this.expect('{');
        }
        this._depth++;
    }

    end() {
        if (this._depth <= 0) {
            throw new protobuf.Error('Invalid depth ' + this.location());
        }
        if (this._token === '}') {
            this.expect('}');
            this.match(';');
            this._depth--;
            return true;
        }
        if (this._token === undefined) {
            if (this._depth !== 1) {
                throw new protobuf.Error('Unexpected end of input' + this.location());
            }
            this._depth--;
            return true;
        }
        return false;
    }

    tag() {
        const name = this._token;
        this.next();
        if (this._token !== '[' && this._token !== '{') {
            this.expect(':');
        }
        return name;
    }

    integer() {
        const token = this._token;
        const value = Number.parseInt(token, 10);
        if (Number.isNaN(token - value)) {
            throw new protobuf.Error("Couldn't parse integer '" + token + "'" + this.location());
        }
        this.next();
        this.semicolon();
        return value;
    }

    double() {
        let value = NaN;
        let token = this._token;
        switch (token) {
            case 'nan': value = NaN; break;
            case 'inf': value = Infinity; break;
            case '-inf': value = -Infinity; break;
            default:
                if (token.endsWith('f')) {
                    token = token.substring(0, token.length - 1);
                }
                value = Number.parseFloat(token);
                if (Number.isNaN(token - value)) {
                    throw new protobuf.Error("Couldn't parse float '" + token + "'" + this.location());
                }
                break;
        }
        this.next();
        this.semicolon();
        return value;
    }

    float() {
        return this.double();
    }

    uint32() {
        return this.integer();
    }

    int32() {
        return this.integer();
    }

    sint32() {
        return this.integer();
    }

    int64() {
        return base.Int64.create(this.integer());
    }

    uint64() {
        return base.Uint64.create(this.integer());
    }

    sint64() {
        return base.Int64.create(this.integer());
    }

    fixed64() {
        return base.Uint64.create(this.integer());
    }

    sfixed64() {
        return base.Int64.create(this.integer());
    }

    fixed32() {
        return this.integer();
    }

    sfixed32() {
        return this.integer();
    }

    string() {
        const token = this._token;
        if (token.length < 2) {
            throw new protobuf.Error('String is too short' + this.location());
        }
        const quote = token[0];
        if (quote !== "'" && quote !== '"') {
            throw new protobuf.Error('String is not in quotes' + this.location());
        }
        if (quote !== token[token.length - 1]) {
            throw new protobuf.Error('String quotes do not match' + this.location());
        }
        const value = token.substring(1, token.length - 1);
        this.next();
        this.semicolon();
        return value;
    }

    bool() {
        const token = this._token;
        switch (token) {
            case 'true':
            case 'True':
            case '1':
                this.next();
                this.semicolon();
                return true;
            case 'false':
            case 'False':
            case '0':
                this.next();
                this.semicolon();
                return false;
            default:
                throw new protobuf.Error("Couldn't parse boolean '" + token + "'" + this.location());
        }
    }

    bytes() {
        const token = this.string();
        const length = token.length;
        const array = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            array[i] = token.charCodeAt(i);
        }
        return array;
    }

    enum(type) {
        const token = this._token;
        let value;
        if (Object.prototype.hasOwnProperty.call(type, token)) {
            value = type[token];
        }
        else {
            value = Number.parseInt(token, 10);
            if (Number.isNaN(token - value)) {
                throw new protobuf.Error("Couldn't parse enum '" + (token === undefined ? '' : token) + "'" + this.location());
            }
        }
        this.next();
        this.semicolon();
        return value;
    }

    any(type) {
        this.start();
        const message = type();
        if (this._token.startsWith('[') && this._token.endsWith(']')) {
            message.type_url = this._token.substring(1, this._token.length - 1).trim();
            this.next();
            this.match(':');
            message.value = this.read();
            this.match(';');
            if (!this.end()) {
                this.expect('}');
            }
        }
        else {
            while (!this.end()) {
                const tag = this.tag();
                switch (tag) {
                    case "type_url":
                        message.type_url = this.string();
                        break;
                    case "value":
                        message.value = this.bytes();
                        break;
                    default:
                        this.field(tag, message);
                        break;
                }
            }
        }
        return message;
    }

    anyarray(obj, type) {
        this.start();
        if (this._token.startsWith('[') && this._token.endsWith(']')) {
            while (!this.end()) {
                if (this._token.startsWith('[') && this._token.endsWith(']')) {
                    const message = type();
                    message.type_url = this._token.substring(1, this._token.length - 1).trim();
                    this.next();
                    this.match(':');
                    message.value = this.read();
                    this.match(';');
                    obj.push(message);
                    continue;
                }
                this.expect('[');
            }
        }
        else {
            const message = type();
            while (!this.end()) {
                const tag = this.tag();
                switch (tag) {
                    case "type_url":
                        message.type_url = this.string();
                        break;
                    case "value":
                        message.value = this.bytes();
                        break;
                    default:
                        this.field(tag, message);
                        break;
                }
            }
            obj.push(message);
        }
    }

    entry(obj, key, value) {
        this.start();
        let k;
        let v;
        while (!this.end()) {
            const tag = this.tag();
            switch (tag) {
                case 'key':
                    k = key();
                    break;
                case 'value':
                    v = value();
                    break;
                default:
                    throw new protobuf.Error("Unsupported entry tag '" + tag + "'.");
            }
        }
        obj[k] = v;
    }

    array(obj, item) {
        if (this.first()) {
            while (!this.last()) {
                obj.push(item());
                switch (this._token) {
                    case ',':
                        this.next();
                        break;
                    case ']':
                        break;
                    default:
                        this.handle(this._token);
                        break;
                }
            }
        }
        else {
            obj.push(item());
        }
    }

    first() {
        if (this.match('[')) {
            this._arrayDepth++;
            return true;
        }
        return false;
    }

    last() {
        if (this.match(']')) {
            this._arrayDepth--;
            return true;
        }
        return false;
    }

    read() {
        const start = this._position;
        this.skip();
        const end = this._position;
        const position = this._decoder.position;
        this._decoder.position = start;
        let content = '';
        while (this._decoder.position < end) {
            content += this._decoder.decode();
        }
        this._decoder.position = position;
        return content;
    }

    skip() {
        switch (this._token) {
            case '{': {
                const depth = this._depth;
                this.start();
                while (!this.end() || depth < this._depth) {
                    if (this._token === '{') {
                        this.start();
                    }
                    else if (this._token !== '}') {
                        this.next();
                        this.match(';');
                    }
                }
                break;
            }
            case '[': {
                const depth = this._arrayDepth;
                this.first();
                while (!this.last() || depth < this._arrayDepth) {
                    this.next();
                    if (this._token === '[') {
                        this.first();
                    }
                    else if (this._token === undefined) {
                        this.handle(this._token);
                    }
                }
                break;
            }
            default: {
                this.next();
                this.semicolon();
                break;
            }
        }
    }

    handle(token) {
        throw new protobuf.Error("Unexpected token '" + token + "'" + this.location());
    }

    field(token /*, module */) {
        throw new protobuf.Error("Unsupported field '" + token + "'" + this.location());
    }

    token() {
        return this._token;
    }

    next() {
        if (this._token === undefined) {
            throw new protobuf.Error('Unexpected end of input' + this.location());
        }
        this._position = this._decoder.position;
        let c = this._decoder.decode();
        for (;;) {
            switch (c) {
                case ' ':
                case '\n':
                case '\r':
                case '\t':
                    this._position = this._decoder.position;
                    c = this._decoder.decode();
                    continue;
                case '#':
                    do {
                        c = this._decoder.decode();
                        if (c === undefined) {
                            this._token = undefined;
                            return;
                        }
                    }
                    while (c !== '\n');
                    this._position = this._decoder.position;
                    c = this._decoder.decode();
                    continue;
                default:
                    break;
            }
            break;
        }
        if (c === undefined) {
            this._token = undefined;
            return;
        }
        if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c === '_' || c === '$') {
            let token = c;
            let position = this._decoder.position;
            for (;;) {
                c = this._decoder.decode();
                if (c === undefined || c === '\n') {
                    break;
                }
                if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c === '_' || c === '+' || c === '-') {
                    token += c;
                    position = this._decoder.position;
                    continue;
                }
                break;
            }
            this._decoder.position = position;
            this._token = token;
            return;
        }
        switch (c) {
            case '{':
            case '}':
            case ':':
            case ',':
            case ']':
            case ';':
                this._token = c;
                return;
            case '[': {
                let token = c;
                let position = this._decoder.position;
                let x = this._decoder.decode();
                if ((x !== undefined) && x >= 'a' && x <= 'z' || x >= 'A' && x <= 'Z') {
                    token += x;
                    for (;;) {
                        x = this._decoder.decode();
                        if (x === undefined || x === '\n') {
                            break;
                        }
                        if (x >= 'a' && x <= 'z' || x >= 'A' && x <= 'Z' || x >= '0' && x <= '9' || x === '.' || x === '/') {
                            token += x;
                            position = this._decoder.position;
                            continue;
                        }
                        if (x === ']') {
                            this._token = token + x;
                            return;
                        }
                    }
                }
                this._decoder.position = position;
                this._token = '[';
                return;
            }
            case '"':
            case "'": {
                const quote = c;
                let content = c;
                for (;;) {
                    c = this._decoder.decode();
                    if (c === undefined || c === '\n') {
                        throw new protobuf.Error('Unexpected end of string' + this.location());
                    }
                    if (c == '\\') {
                        c = this._decoder.decode();
                        if (c === undefined || c === '\n') {
                            throw new protobuf.Error('Unexpected end of string' + this.location());
                        }
                        switch (c) {
                            case '\\': c = '\\'; break;
                            case "'": c = "'"; break;
                            case '"': c = '"'; break;
                            case 'r': c = '\r'; break;
                            case 'n': c = '\n'; break;
                            case 't': c = '\t'; break;
                            case 'b': c = '\b'; break;
                            case 'x':
                            case 'X': {
                                let value = 0;
                                for (let xi = 0; xi < 2; xi++) {
                                    let xd = this._decoder.decode();
                                    if (xd === undefined) {
                                        throw new protobuf.Error('Unexpected end of string' + this.location());
                                    }
                                    xd = xd.charCodeAt(0);
                                    xd = xd >= 65 && xd <= 70 ? xd - 55 : xd >= 97 && xd <= 102 ? xd - 87 : xd >= 48 && xd <= 57 ? xd - 48 : -1;
                                    if (xd === -1) {
                                        throw new protobuf.Error("Unexpected hex digit '" + xd + "' in bytes string" + this.location());
                                    }
                                    value = value << 4 | xd;
                                }
                                c = String.fromCharCode(value);
                                break;
                            }
                            default: {
                                if (c < '0' || c > '9') {
                                    throw new protobuf.Error("Unexpected character '" + c + "' in string" + this.location());
                                }
                                let value = 0;
                                let od = c;
                                if (od < '0' || od > '9') {
                                    throw new protobuf.Error("Unexpected octal digit '" + od + "' in bytes string" + this.location());
                                }
                                od = od.charCodeAt(0);
                                value = value << 3 | od - 48;
                                od = this._decoder.decode();
                                if (od === undefined) {
                                    throw new protobuf.Error('Unexpected end of string' + this.location());
                                }
                                if (od < '0' || od > '9') {
                                    throw new protobuf.Error("Unexpected octal digit '" + od + "' in bytes string" + this.location());
                                }
                                od = od.charCodeAt(0);
                                value = value << 3 | od - 48;
                                od = this._decoder.decode();
                                if (od === undefined) {
                                    throw new protobuf.Error('Unexpected end of string' + this.location());
                                }
                                if (od < '0' || od > '9') {
                                    throw new protobuf.Error("Unexpected octal digit '" + od + "' in bytes string" + this.location());
                                }
                                od = od.charCodeAt(0);
                                value = value << 3 | od - 48;
                                c = String.fromCharCode(value);
                                break;
                            }
                        }
                        content += c;
                        continue;
                    }
                    else {
                        content += c;
                        if (c === quote) {
                            break;
                        }
                    }
                }
                this._token = content;
                return;
            }
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
            case '-': case '+': case '.': {
                let token = c;
                let position = this._decoder.position;
                for (;;) {
                    c = this._decoder.decode();
                    if (c === undefined || c === '\n') {
                        break;
                    }
                    if ((c >= '0' && c <= '9') || c === '_' || c === '+' || c === '-' || c === '.' || c === 'e' || c === 'E') {
                        token += c;
                        position = this._decoder.position;
                        continue;
                    }
                    break;
                }
                if (token === '-' && c === 'i' && this._decoder.decode() === 'n' && this._decoder.decode() === 'f') {
                    token = '-inf';
                    position = this._decoder.position;
                }
                if (token === '-' || token === '+' || token === '.') {
                    throw new protobuf.Error("Unexpected token '" + token + "'" + this.location());
                }
                this._decoder.position = position;
                this._token = token;
                return;
            }
            default: {
                throw new protobuf.Error("Unexpected token '" + c + "'" + this.location());
            }
        }
    }

    expect(value) {
        if (this._token !== value) {
            throw new protobuf.Error("Unexpected '" + this._token + "' instead of '" + value + "'" + this.location());
        }
        this.next();
    }

    match(value) {
        if (value == this._token) {
            this.next();
            return true;
        }
        return false;
    }

    location() {
        let line = 1;
        let column = 1;
        this._decoder.position = 0;
        let c;
        do {
            if (this._decoder.position === this._position) {
                return ' at ' + line.toString() + ':' + column.toString() + '.';
            }
            c = this._decoder.decode();
            if (c === '\n') {
                line++;
                column = 1;
            }
            else {
                column++;
            }
        }
        while (c !== undefined);
        return ' at ' + line.toString() + ':' + column.toString() + '.';
    }

    semicolon() {
        if (this._arrayDepth === 0) {
            this.match(';');
        }
    }
};

protobuf.Int64 = base.Int64;
protobuf.Uint64 = base.Uint64;

protobuf.LongBits = class {

    constructor(lo, hi) {
        this.lo = lo >>> 0;
        this.hi = hi >>> 0;
    }

    zzDecode() {
        const mask = -(this.lo & 1);
        this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
        this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
        return this;
    }

    toUint64() {
        return new base.Uint64(this.lo, this.hi);
    }

    toInt64() {
        return new base.Int64(this.lo, this.hi);
    }
};

protobuf.Error = class extends Error {

    constructor(message) {
        super(message);
        this.name = 'Protocol Buffer Error';
        this.message = message;
    }
};

if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    module.exports.BinaryReader = protobuf.BinaryReader;
    module.exports.TextReader = protobuf.TextReader;
    module.exports.Error = protobuf.Error;
    module.exports.Int64 = protobuf.Int64;
    module.exports.Uint64 = protobuf.Uint64;
    module.exports.get = protobuf.get;
}

//// onnx-proto.js
var $root = protobuf.get('onnx');
console.log("Just did protobuf.get('onnx')", $root);

$root.onnx = {};

$root.onnx.Version = {
    "_START_VERSION": 0,
    "IR_VERSION_2017_10_10": 1,
    "IR_VERSION_2017_10_30": 2,
    "IR_VERSION_2017_11_3": 3,
    "IR_VERSION_2019_1_22": 4,
    "IR_VERSION_2019_3_18": 5,
    "IR_VERSION_2019_9_19": 6,
    "IR_VERSION_2020_5_8": 7,
    "IR_VERSION": 8
};

$root.onnx.AttributeProto = class AttributeProto {

    constructor() {
        this.floats = [];
        this.ints = [];
        this.strings = [];
        this.tensors = [];
        this.graphs = [];
        this.sparse_tensors = [];
        this.type_protos = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.AttributeProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 21:
                    message.ref_attr_name = reader.string();
                    break;
                case 13:
                    message.doc_string = reader.string();
                    break;
                case 20:
                    message.type = reader.int32();
                    break;
                case 2:
                    message.f = reader.float();
                    break;
                case 3:
                    message.i = reader.int64();
                    break;
                case 4:
                    message.s = reader.bytes();
                    break;
                case 5:
                    message.t = $root.onnx.TensorProto.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.g = $root.onnx.GraphProto.decode(reader, reader.uint32());
                    break;
                case 22:
                    message.sparse_tensor = $root.onnx.SparseTensorProto.decode(reader, reader.uint32());
                    break;
                case 14:
                    message.tp = $root.onnx.TypeProto.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.floats = reader.floats(message.floats, tag);
                    break;
                case 8:
                    message.ints = reader.array(message.ints, () => reader.int64(), tag);
                    break;
                case 9:
                    message.strings.push(reader.bytes());
                    break;
                case 10:
                    message.tensors.push($root.onnx.TensorProto.decode(reader, reader.uint32()));
                    break;
                case 11:
                    message.graphs.push($root.onnx.GraphProto.decode(reader, reader.uint32()));
                    break;
                case 23:
                    message.sparse_tensors.push($root.onnx.SparseTensorProto.decode(reader, reader.uint32()));
                    break;
                case 15:
                    message.type_protos.push($root.onnx.TypeProto.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.AttributeProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "name":
                    message.name = reader.string();
                    break;
                case "ref_attr_name":
                    message.ref_attr_name = reader.string();
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                case "type":
                    message.type = reader.enum($root.onnx.AttributeProto.AttributeType);
                    break;
                case "f":
                    message.f = reader.float();
                    break;
                case "i":
                    message.i = reader.int64();
                    break;
                case "s":
                    message.s = reader.bytes();
                    break;
                case "t":
                    message.t = $root.onnx.TensorProto.decodeText(reader);
                    break;
                case "g":
                    message.g = $root.onnx.GraphProto.decodeText(reader);
                    break;
                case "sparse_tensor":
                    message.sparse_tensor = $root.onnx.SparseTensorProto.decodeText(reader);
                    break;
                case "tp":
                    message.tp = $root.onnx.TypeProto.decodeText(reader);
                    break;
                case "floats":
                    reader.array(message.floats, () => reader.float());
                    break;
                case "ints":
                    reader.array(message.ints, () => reader.int64());
                    break;
                case "strings":
                    reader.array(message.strings, () => reader.bytes());
                    break;
                case "tensors":
                    message.tensors.push($root.onnx.TensorProto.decodeText(reader));
                    break;
                case "graphs":
                    message.graphs.push($root.onnx.GraphProto.decodeText(reader));
                    break;
                case "sparse_tensors":
                    message.sparse_tensors.push($root.onnx.SparseTensorProto.decodeText(reader));
                    break;
                case "type_protos":
                    message.type_protos.push($root.onnx.TypeProto.decodeText(reader));
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.AttributeProto.prototype.name = "";
$root.onnx.AttributeProto.prototype.ref_attr_name = "";
$root.onnx.AttributeProto.prototype.doc_string = "";
$root.onnx.AttributeProto.prototype.type = 0;
$root.onnx.AttributeProto.prototype.f = 0;
$root.onnx.AttributeProto.prototype.i = protobuf.Int64.create(0);
$root.onnx.AttributeProto.prototype.s = new Uint8Array([]);
$root.onnx.AttributeProto.prototype.t = null;
$root.onnx.AttributeProto.prototype.g = null;
$root.onnx.AttributeProto.prototype.sparse_tensor = null;
$root.onnx.AttributeProto.prototype.tp = null;

$root.onnx.AttributeProto.AttributeType = {
    "UNDEFINED": 0,
    "FLOAT": 1,
    "INT": 2,
    "STRING": 3,
    "TENSOR": 4,
    "GRAPH": 5,
    "SPARSE_TENSOR": 11,
    "TYPE_PROTO": 13,
    "FLOATS": 6,
    "INTS": 7,
    "STRINGS": 8,
    "TENSORS": 9,
    "GRAPHS": 10,
    "SPARSE_TENSORS": 12,
    "TYPE_PROTOS": 14
};

$root.onnx.ValueInfoProto = class ValueInfoProto {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.ValueInfoProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.type = $root.onnx.TypeProto.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.doc_string = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.ValueInfoProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "name":
                    message.name = reader.string();
                    break;
                case "type":
                    message.type = $root.onnx.TypeProto.decodeText(reader);
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.ValueInfoProto.prototype.name = "";
$root.onnx.ValueInfoProto.prototype.type = null;
$root.onnx.ValueInfoProto.prototype.doc_string = "";

$root.onnx.NodeProto = class NodeProto {

    constructor() {
        this.input = [];
        this.output = [];
        this.attribute = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.NodeProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.input.push(reader.string());
                    break;
                case 2:
                    message.output.push(reader.string());
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.op_type = reader.string();
                    break;
                case 7:
                    message.domain = reader.string();
                    break;
                case 5:
                    message.attribute.push($root.onnx.AttributeProto.decode(reader, reader.uint32()));
                    break;
                case 6:
                    message.doc_string = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.NodeProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "input":
                    reader.array(message.input, () => reader.string());
                    break;
                case "output":
                    reader.array(message.output, () => reader.string());
                    break;
                case "name":
                    message.name = reader.string();
                    break;
                case "op_type":
                    message.op_type = reader.string();
                    break;
                case "domain":
                    message.domain = reader.string();
                    break;
                case "attribute":
                    message.attribute.push($root.onnx.AttributeProto.decodeText(reader));
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.NodeProto.prototype.name = "";
$root.onnx.NodeProto.prototype.op_type = "";
$root.onnx.NodeProto.prototype.domain = "";
$root.onnx.NodeProto.prototype.doc_string = "";

$root.onnx.TrainingInfoProto = class TrainingInfoProto {

    constructor() {
        this.initialization_binding = [];
        this.update_binding = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.TrainingInfoProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.initialization = $root.onnx.GraphProto.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.algorithm = $root.onnx.GraphProto.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.initialization_binding.push($root.onnx.StringStringEntryProto.decode(reader, reader.uint32()));
                    break;
                case 4:
                    message.update_binding.push($root.onnx.StringStringEntryProto.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TrainingInfoProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "initialization":
                    message.initialization = $root.onnx.GraphProto.decodeText(reader);
                    break;
                case "algorithm":
                    message.algorithm = $root.onnx.GraphProto.decodeText(reader);
                    break;
                case "initialization_binding":
                    message.initialization_binding.push($root.onnx.StringStringEntryProto.decodeText(reader));
                    break;
                case "update_binding":
                    message.update_binding.push($root.onnx.StringStringEntryProto.decodeText(reader));
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TrainingInfoProto.prototype.initialization = null;
$root.onnx.TrainingInfoProto.prototype.algorithm = null;

$root.onnx.ModelProto = class ModelProto {

    constructor() {
        this.opset_import = [];
        this.metadata_props = [];
        this.training_info = [];
        this.functions = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.ModelProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.ir_version = reader.int64();
                    break;
                case 8:
                    message.opset_import.push($root.onnx.OperatorSetIdProto.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.producer_name = reader.string();
                    break;
                case 3:
                    message.producer_version = reader.string();
                    break;
                case 4:
                    message.domain = reader.string();
                    break;
                case 5:
                    message.model_version = reader.int64();
                    break;
                case 6:
                    message.doc_string = reader.string();
                    break;
                case 7:
                    message.graph = $root.onnx.GraphProto.decode(reader, reader.uint32());
                    break;
                case 14:
                    message.metadata_props.push($root.onnx.StringStringEntryProto.decode(reader, reader.uint32()));
                    break;
                case 20:
                    message.training_info.push($root.onnx.TrainingInfoProto.decode(reader, reader.uint32()));
                    break;
                case 25:
                    message.functions.push($root.onnx.FunctionProto.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.ModelProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "ir_version":
                    message.ir_version = reader.int64();
                    break;
                case "opset_import":
                    message.opset_import.push($root.onnx.OperatorSetIdProto.decodeText(reader));
                    break;
                case "producer_name":
                    message.producer_name = reader.string();
                    break;
                case "producer_version":
                    message.producer_version = reader.string();
                    break;
                case "domain":
                    message.domain = reader.string();
                    break;
                case "model_version":
                    message.model_version = reader.int64();
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                case "graph":
                    message.graph = $root.onnx.GraphProto.decodeText(reader);
                    break;
                case "metadata_props":
                    message.metadata_props.push($root.onnx.StringStringEntryProto.decodeText(reader));
                    break;
                case "training_info":
                    message.training_info.push($root.onnx.TrainingInfoProto.decodeText(reader));
                    break;
                case "functions":
                    message.functions.push($root.onnx.FunctionProto.decodeText(reader));
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.ModelProto.prototype.ir_version = protobuf.Int64.create(0);
$root.onnx.ModelProto.prototype.producer_name = "";
$root.onnx.ModelProto.prototype.producer_version = "";
$root.onnx.ModelProto.prototype.domain = "";
$root.onnx.ModelProto.prototype.model_version = protobuf.Int64.create(0);
$root.onnx.ModelProto.prototype.doc_string = "";
$root.onnx.ModelProto.prototype.graph = null;

$root.onnx.StringStringEntryProto = class StringStringEntryProto {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.StringStringEntryProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.string();
                    break;
                case 2:
                    message.value = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.StringStringEntryProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "key":
                    message.key = reader.string();
                    break;
                case "value":
                    message.value = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.StringStringEntryProto.prototype.key = "";
$root.onnx.StringStringEntryProto.prototype.value = "";

$root.onnx.TensorAnnotation = class TensorAnnotation {

    constructor() {
        this.quant_parameter_tensor_names = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.TensorAnnotation();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.tensor_name = reader.string();
                    break;
                case 2:
                    message.quant_parameter_tensor_names.push($root.onnx.StringStringEntryProto.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TensorAnnotation();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "tensor_name":
                    message.tensor_name = reader.string();
                    break;
                case "quant_parameter_tensor_names":
                    message.quant_parameter_tensor_names.push($root.onnx.StringStringEntryProto.decodeText(reader));
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TensorAnnotation.prototype.tensor_name = "";

$root.onnx.GraphProto = class GraphProto {

    constructor() {
        this.node = [];
        this.initializer = [];
        this.sparse_initializer = [];
        this.input = [];
        this.output = [];
        this.value_info = [];
        this.quantization_annotation = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.GraphProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.node.push($root.onnx.NodeProto.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 5:
                    message.initializer.push($root.onnx.TensorProto.decode(reader, reader.uint32()));
                    break;
                case 15:
                    message.sparse_initializer.push($root.onnx.SparseTensorProto.decode(reader, reader.uint32()));
                    break;
                case 10:
                    message.doc_string = reader.string();
                    break;
                case 11:
                    message.input.push($root.onnx.ValueInfoProto.decode(reader, reader.uint32()));
                    break;
                case 12:
                    message.output.push($root.onnx.ValueInfoProto.decode(reader, reader.uint32()));
                    break;
                case 13:
                    message.value_info.push($root.onnx.ValueInfoProto.decode(reader, reader.uint32()));
                    break;
                case 14:
                    message.quantization_annotation.push($root.onnx.TensorAnnotation.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.GraphProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "node":
                    message.node.push($root.onnx.NodeProto.decodeText(reader));
                    break;
                case "name":
                    message.name = reader.string();
                    break;
                case "initializer":
                    message.initializer.push($root.onnx.TensorProto.decodeText(reader));
                    break;
                case "sparse_initializer":
                    message.sparse_initializer.push($root.onnx.SparseTensorProto.decodeText(reader));
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                case "input":
                    message.input.push($root.onnx.ValueInfoProto.decodeText(reader));
                    break;
                case "output":
                    message.output.push($root.onnx.ValueInfoProto.decodeText(reader));
                    break;
                case "value_info":
                    message.value_info.push($root.onnx.ValueInfoProto.decodeText(reader));
                    break;
                case "quantization_annotation":
                    message.quantization_annotation.push($root.onnx.TensorAnnotation.decodeText(reader));
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.GraphProto.prototype.name = "";
$root.onnx.GraphProto.prototype.doc_string = "";

$root.onnx.TensorProto = class TensorProto {

    constructor() {
        this.dims = [];
        this.float_data = [];
        this.int32_data = [];
        this.string_data = [];
        this.int64_data = [];
        this.external_data = [];
        this.double_data = [];
        this.uint64_data = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.TensorProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.dims = reader.array(message.dims, () => reader.int64(), tag);
                    break;
                case 2:
                    message.data_type = reader.int32();
                    break;
                case 3:
                    message.segment = $root.onnx.TensorProto.Segment.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.float_data = reader.floats(message.float_data, tag);
                    break;
                case 5:
                    message.int32_data = reader.array(message.int32_data, () => reader.int32(), tag);
                    break;
                case 6:
                    message.string_data.push(reader.bytes());
                    break;
                case 7:
                    message.int64_data = reader.array(message.int64_data, () => reader.int64(), tag);
                    break;
                case 8:
                    message.name = reader.string();
                    break;
                case 12:
                    message.doc_string = reader.string();
                    break;
                case 9:
                    message.raw_data = reader.bytes();
                    break;
                case 13:
                    message.external_data.push($root.onnx.StringStringEntryProto.decode(reader, reader.uint32()));
                    break;
                case 14:
                    message.data_location = reader.int32();
                    break;
                case 10:
                    message.double_data = reader.doubles(message.double_data, tag);
                    break;
                case 11:
                    message.uint64_data = reader.array(message.uint64_data, () => reader.uint64(), tag);
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TensorProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "dims":
                    reader.array(message.dims, () => reader.int64());
                    break;
                case "data_type":
                    message.data_type = reader.int32();
                    break;
                case "segment":
                    message.segment = $root.onnx.TensorProto.Segment.decodeText(reader);
                    break;
                case "float_data":
                    reader.array(message.float_data, () => reader.float());
                    break;
                case "int32_data":
                    reader.array(message.int32_data, () => reader.int32());
                    break;
                case "string_data":
                    reader.array(message.string_data, () => reader.bytes());
                    break;
                case "int64_data":
                    reader.array(message.int64_data, () => reader.int64());
                    break;
                case "name":
                    message.name = reader.string();
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                case "raw_data":
                    message.raw_data = reader.bytes();
                    break;
                case "external_data":
                    message.external_data.push($root.onnx.StringStringEntryProto.decodeText(reader));
                    break;
                case "data_location":
                    message.data_location = reader.enum($root.onnx.TensorProto.DataLocation);
                    break;
                case "double_data":
                    reader.array(message.double_data, () => reader.double());
                    break;
                case "uint64_data":
                    reader.array(message.uint64_data, () => reader.uint64());
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TensorProto.prototype.data_type = 0;
$root.onnx.TensorProto.prototype.segment = null;
$root.onnx.TensorProto.prototype.name = "";
$root.onnx.TensorProto.prototype.doc_string = "";
$root.onnx.TensorProto.prototype.raw_data = new Uint8Array([]);
$root.onnx.TensorProto.prototype.data_location = 0;

$root.onnx.TensorProto.DataType = {
    "UNDEFINED": 0,
    "FLOAT": 1,
    "UINT8": 2,
    "INT8": 3,
    "UINT16": 4,
    "INT16": 5,
    "INT32": 6,
    "INT64": 7,
    "STRING": 8,
    "BOOL": 9,
    "FLOAT16": 10,
    "DOUBLE": 11,
    "UINT32": 12,
    "UINT64": 13,
    "COMPLEX64": 14,
    "COMPLEX128": 15,
    "BFLOAT16": 16
};

$root.onnx.TensorProto.Segment = class Segment {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.TensorProto.Segment();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.begin = reader.int64();
                    break;
                case 2:
                    message.end = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TensorProto.Segment();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "begin":
                    message.begin = reader.int64();
                    break;
                case "end":
                    message.end = reader.int64();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TensorProto.Segment.prototype.begin = protobuf.Int64.create(0);
$root.onnx.TensorProto.Segment.prototype.end = protobuf.Int64.create(0);

$root.onnx.TensorProto.DataLocation = {
    "DEFAULT": 0,
    "EXTERNAL": 1
};

$root.onnx.SparseTensorProto = class SparseTensorProto {

    constructor() {
        this.dims = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.SparseTensorProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.values = $root.onnx.TensorProto.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.indices = $root.onnx.TensorProto.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.dims = reader.array(message.dims, () => reader.int64(), tag);
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.SparseTensorProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "values":
                    message.values = $root.onnx.TensorProto.decodeText(reader);
                    break;
                case "indices":
                    message.indices = $root.onnx.TensorProto.decodeText(reader);
                    break;
                case "dims":
                    reader.array(message.dims, () => reader.int64());
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.SparseTensorProto.prototype.values = null;
$root.onnx.SparseTensorProto.prototype.indices = null;

$root.onnx.TensorShapeProto = class TensorShapeProto {

    constructor() {
        this.dim = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.TensorShapeProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.dim.push($root.onnx.TensorShapeProto.Dimension.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TensorShapeProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "dim":
                    message.dim.push($root.onnx.TensorShapeProto.Dimension.decodeText(reader));
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TensorShapeProto.Dimension = class Dimension {

    constructor() {
    }

    get value() {
        $root.onnx.TensorShapeProto.Dimension.valueSet = $root.onnx.TensorShapeProto.Dimension.valueSet || new Set([ "dim_value", "dim_param"]);
        return Object.keys(this).find((key) => $root.onnx.TensorShapeProto.Dimension.valueSet.has(key) && this[key] != null);
    }

    static decode(reader, length) {
        const message = new $root.onnx.TensorShapeProto.Dimension();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.dim_value = reader.int64();
                    break;
                case 2:
                    message.dim_param = reader.string();
                    break;
                case 3:
                    message.denotation = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TensorShapeProto.Dimension();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "dim_value":
                    message.dim_value = reader.int64();
                    break;
                case "dim_param":
                    message.dim_param = reader.string();
                    break;
                case "denotation":
                    message.denotation = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TensorShapeProto.Dimension.prototype.denotation = "";

$root.onnx.TypeProto = class TypeProto {

    constructor() {
    }

    get value() {
        $root.onnx.TypeProto.valueSet = $root.onnx.TypeProto.valueSet || new Set([ "tensor_type", "sequence_type", "map_type", "optional_type", "sparse_tensor_type", "opaque_type"]);
        return Object.keys(this).find((key) => $root.onnx.TypeProto.valueSet.has(key) && this[key] != null);
    }

    static decode(reader, length) {
        const message = new $root.onnx.TypeProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.tensor_type = $root.onnx.TypeProto.Tensor.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.sequence_type = $root.onnx.TypeProto.Sequence.decode(reader, reader.uint32());
                    break;
                case 5:
                    message.map_type = $root.onnx.TypeProto.Map.decode(reader, reader.uint32());
                    break;
                case 9:
                    message.optional_type = $root.onnx.TypeProto.Optional.decode(reader, reader.uint32());
                    break;
                case 8:
                    message.sparse_tensor_type = $root.onnx.TypeProto.SparseTensor.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.opaque_type = $root.onnx.TypeProto.Opaque.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.denotation = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TypeProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "tensor_type":
                    message.tensor_type = $root.onnx.TypeProto.Tensor.decodeText(reader);
                    break;
                case "sequence_type":
                    message.sequence_type = $root.onnx.TypeProto.Sequence.decodeText(reader);
                    break;
                case "map_type":
                    message.map_type = $root.onnx.TypeProto.Map.decodeText(reader);
                    break;
                case "optional_type":
                    message.optional_type = $root.onnx.TypeProto.Optional.decodeText(reader);
                    break;
                case "sparse_tensor_type":
                    message.sparse_tensor_type = $root.onnx.TypeProto.SparseTensor.decodeText(reader);
                    break;
                case "opaque_type":
                    message.opaque_type = $root.onnx.TypeProto.Opaque.decodeText(reader);
                    break;
                case "denotation":
                    message.denotation = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TypeProto.prototype.denotation = "";

$root.onnx.TypeProto.Tensor = class Tensor {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.TypeProto.Tensor();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.elem_type = reader.int32();
                    break;
                case 2:
                    message.shape = $root.onnx.TensorShapeProto.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TypeProto.Tensor();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "elem_type":
                    message.elem_type = reader.int32();
                    break;
                case "shape":
                    message.shape = $root.onnx.TensorShapeProto.decodeText(reader);
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TypeProto.Tensor.prototype.elem_type = 0;
$root.onnx.TypeProto.Tensor.prototype.shape = null;

$root.onnx.TypeProto.Sequence = class Sequence {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.TypeProto.Sequence();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.elem_type = $root.onnx.TypeProto.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TypeProto.Sequence();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "elem_type":
                    message.elem_type = $root.onnx.TypeProto.decodeText(reader);
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TypeProto.Sequence.prototype.elem_type = null;

$root.onnx.TypeProto.Map = class Map {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.TypeProto.Map();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key_type = reader.int32();
                    break;
                case 2:
                    message.value_type = $root.onnx.TypeProto.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TypeProto.Map();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "key_type":
                    message.key_type = reader.int32();
                    break;
                case "value_type":
                    message.value_type = $root.onnx.TypeProto.decodeText(reader);
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TypeProto.Map.prototype.key_type = 0;
$root.onnx.TypeProto.Map.prototype.value_type = null;

$root.onnx.TypeProto.Optional = class Optional {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.TypeProto.Optional();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.elem_type = $root.onnx.TypeProto.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TypeProto.Optional();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "elem_type":
                    message.elem_type = $root.onnx.TypeProto.decodeText(reader);
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TypeProto.Optional.prototype.elem_type = null;

$root.onnx.TypeProto.SparseTensor = class SparseTensor {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.TypeProto.SparseTensor();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.elem_type = reader.int32();
                    break;
                case 2:
                    message.shape = $root.onnx.TensorShapeProto.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TypeProto.SparseTensor();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "elem_type":
                    message.elem_type = reader.int32();
                    break;
                case "shape":
                    message.shape = $root.onnx.TensorShapeProto.decodeText(reader);
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TypeProto.SparseTensor.prototype.elem_type = 0;
$root.onnx.TypeProto.SparseTensor.prototype.shape = null;

$root.onnx.TypeProto.Opaque = class Opaque {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.TypeProto.Opaque();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.domain = reader.string();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.TypeProto.Opaque();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "domain":
                    message.domain = reader.string();
                    break;
                case "name":
                    message.name = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.TypeProto.Opaque.prototype.domain = "";
$root.onnx.TypeProto.Opaque.prototype.name = "";

$root.onnx.OperatorSetIdProto = class OperatorSetIdProto {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.OperatorSetIdProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.domain = reader.string();
                    break;
                case 2:
                    message.version = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.OperatorSetIdProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "domain":
                    message.domain = reader.string();
                    break;
                case "version":
                    message.version = reader.int64();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.OperatorSetIdProto.prototype.domain = "";
$root.onnx.OperatorSetIdProto.prototype.version = protobuf.Int64.create(0);

$root.onnx.OperatorStatus = {
    "EXPERIMENTAL": 0,
    "STABLE": 1
};

$root.onnx.FunctionProto = class FunctionProto {

    constructor() {
        this.input = [];
        this.output = [];
        this.attribute = [];
        this.node = [];
        this.opset_import = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.FunctionProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 4:
                    message.input.push(reader.string());
                    break;
                case 5:
                    message.output.push(reader.string());
                    break;
                case 6:
                    message.attribute.push(reader.string());
                    break;
                case 7:
                    message.node.push($root.onnx.NodeProto.decode(reader, reader.uint32()));
                    break;
                case 8:
                    message.doc_string = reader.string();
                    break;
                case 9:
                    message.opset_import.push($root.onnx.OperatorSetIdProto.decode(reader, reader.uint32()));
                    break;
                case 10:
                    message.domain = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.FunctionProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "name":
                    message.name = reader.string();
                    break;
                case "input":
                    reader.array(message.input, () => reader.string());
                    break;
                case "output":
                    reader.array(message.output, () => reader.string());
                    break;
                case "attribute":
                    reader.array(message.attribute, () => reader.string());
                    break;
                case "node":
                    message.node.push($root.onnx.NodeProto.decodeText(reader));
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                case "opset_import":
                    message.opset_import.push($root.onnx.OperatorSetIdProto.decodeText(reader));
                    break;
                case "domain":
                    message.domain = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.FunctionProto.prototype.name = "";
$root.onnx.FunctionProto.prototype.doc_string = "";
$root.onnx.FunctionProto.prototype.domain = "";

$root.onnx.OperatorProto = class OperatorProto {

    constructor() {
    }

    static decode(reader, length) {
        const message = new $root.onnx.OperatorProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.op_type = reader.string();
                    break;
                case 2:
                    message.since_version = reader.int64();
                    break;
                case 3:
                    message.status = reader.int32();
                    break;
                case 10:
                    message.doc_string = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.OperatorProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "op_type":
                    message.op_type = reader.string();
                    break;
                case "since_version":
                    message.since_version = reader.int64();
                    break;
                case "status":
                    message.status = reader.enum($root.onnx.OperatorStatus);
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.OperatorProto.prototype.op_type = "";
$root.onnx.OperatorProto.prototype.since_version = protobuf.Int64.create(0);
$root.onnx.OperatorProto.prototype.status = 0;
$root.onnx.OperatorProto.prototype.doc_string = "";

$root.onnx.OperatorSetProto = class OperatorSetProto {

    constructor() {
        this.operator = [];
        this.functions = [];
    }

    static decode(reader, length) {
        const message = new $root.onnx.OperatorSetProto();
        const end = length !== undefined ? reader.position + length : reader.length;
        while (reader.position < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.magic = reader.string();
                    break;
                case 2:
                    message.ir_version = reader.int64();
                    break;
                case 3:
                    message.ir_version_prerelease = reader.string();
                    break;
                case 7:
                    message.ir_build_metadata = reader.string();
                    break;
                case 4:
                    message.domain = reader.string();
                    break;
                case 5:
                    message.opset_version = reader.int64();
                    break;
                case 6:
                    message.doc_string = reader.string();
                    break;
                case 8:
                    message.operator.push($root.onnx.OperatorProto.decode(reader, reader.uint32()));
                    break;
                case 9:
                    message.functions.push($root.onnx.FunctionProto.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    }

    static decodeText(reader) {
        const message = new $root.onnx.OperatorSetProto();
        reader.start();
        while (!reader.end()) {
            const tag = reader.tag();
            switch (tag) {
                case "magic":
                    message.magic = reader.string();
                    break;
                case "ir_version":
                    message.ir_version = reader.int64();
                    break;
                case "ir_version_prerelease":
                    message.ir_version_prerelease = reader.string();
                    break;
                case "ir_build_metadata":
                    message.ir_build_metadata = reader.string();
                    break;
                case "domain":
                    message.domain = reader.string();
                    break;
                case "opset_version":
                    message.opset_version = reader.int64();
                    break;
                case "doc_string":
                    message.doc_string = reader.string();
                    break;
                case "operator":
                    message.operator.push($root.onnx.OperatorProto.decodeText(reader));
                    break;
                case "functions":
                    message.functions.push($root.onnx.FunctionProto.decodeText(reader));
                    break;
                default:
                    reader.field(tag, message);
                    break;
            }
        }
        return message;
    }
};

$root.onnx.OperatorSetProto.prototype.magic = "";
$root.onnx.OperatorSetProto.prototype.ir_version = protobuf.Int64.create(0);
$root.onnx.OperatorSetProto.prototype.ir_version_prerelease = "";
$root.onnx.OperatorSetProto.prototype.ir_build_metadata = "";
$root.onnx.OperatorSetProto.prototype.domain = "";
$root.onnx.OperatorSetProto.prototype.opset_version = protobuf.Int64.create(0);
$root.onnx.OperatorSetProto.prototype.doc_string = "";
