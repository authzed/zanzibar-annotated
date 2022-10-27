// From: https://github.com/WesleyAC/deeplinks/blob/main/src/util/base64.ts
// Original License Below:
// Copyright © 2021 Wesley Aptekar-Cassels
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript/6573119#6573119
// modified for typescript/general modernization/aesthetics/etc
// the alphabet has also been changed to use more reasonable characters for a url.

const _rixits =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

// This cannot handle negative numbers and only works on the integer part,
// discarding the fractional part. Doing better means deciding on whether
// you're just representing the subset of javascript numbers of
// twos-complement 32-bit integers or going with base-64 representations for
// the bit pattern of the underlying IEEE floating-point number, or
// representing the mantissae and exponents separately, or some other
// possibility. For now, bail
export function fromNumber(number: number): string {
  if (isNaN(number) || number === Infinity || number < 0) {
    throw 'invalid input';
  }

  let result = '',
    rixit; // like 'digit', only in some non-decimal radix
  number = Math.floor(number);
  for (;;) {
    rixit = number % 64;
    result = _rixits.charAt(rixit) + result;
    number = Math.floor(number / 64);

    if (number == 0) {
      break;
    }
  }
  return result;
}

export function toNumber(string: string): number {
  let result = 0;
  const rixits = string.split('');
  for (let e = 0; e < rixits.length; e++) {
    result = result * 64 + _rixits.indexOf(rixits[e]);
  }
  return result;
}
