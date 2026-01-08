/**
 * Validation Utilities Tests
 *
 * Testing suite for input validation and type guards
 */import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isObject,
  isString,
  isNumber,
  isPositiveNumber,
  isNumberInRange,
  validateToken,
  validateTrade,
  validateComment,
  validatePrice,
  sanitizeAPIResponse,
  validateArray,
  sanitizeString,
  isValidWalletAddress,
  isValidURL,
  isValidTokenId,
  safeJSONParse,
  validateBatch
} from '../../utils/validation';
import { Token, Trade, Comment } from '../../types';

describe('Validation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Type Guards', () => {
    describe('isObject', () => {
      it('should return true for plain objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: 'value' })).toBe(true);
        expect(isObject({ a: 1, b: 2 })).toBe(true);
      });

      it('should return false for non-objects', () => {
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject('string')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(true)).toBe(false);
        expect(isObject([1, 2, 3])).toBe(false);
      });
    });

    describe('isString', () => {
      it('should return true for strings', () => {
        expect(isString('')).toBe(true);
        expect(isString('hello')).toBe(true);
        expect(isString('123')).toBe(true);
      });

      it('should return false for non-strings', () => {
        expect(isString(123)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString({})).toBe(false);
        expect(isString([])).toBe(false);
      });
    });

    describe('isNumber', () => {
      it('should return true for valid numbers', () => {
        expect(isNumber(0)).toBe(true);
        expect(isNumber(1)).toBe(true);
        expect(isNumber(-1)).toBe(true);
        expect(isNumber(1.5)).toBe(true);
        expect(isNumber(Number.MAX_VALUE)).toBe(true);
        expect(isNumber(Number.MIN_VALUE)).toBe(true);
      });

      it('should return false for non-numbers', () => {
        expect(isNumber(NaN)).toBe(false);
        expect(isNumber(Infinity)).toBe(false);
        expect(isNumber(-Infinity)).toBe(false);
        expect(isNumber('123')).toBe(false);
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
      });
    });

    describe('isPositiveNumber', () => {
      it('should return true for positive numbers', () => {
        expect(isPositiveNumber(1)).toBe(true);
        expect(isPositiveNumber(0.1)).toBe(true);
        expect(isPositiveNumber(Number.MAX_VALUE)).toBe(true);
      });

      it('should return false for non-positive numbers', () => {
        expect(isPositiveNumber(0)).toBe(false);
        expect(isPositiveNumber(-1)).toBe(false);
        expect(isPositiveNumber(-0.1)).toBe(false);
      });
    });

    describe('isNumberInRange', () => {
      it('should return true for numbers in range', () => {
        expect(isNumberInRange(5, 0, 10)).toBe(true);
        expect(isNumberInRange(0, 0, 10)).toBe(true);
        expect(isNumberInRange(10, 0, 10)).toBe(true);
        expect(isNumberInRange(-5, -10, 0)).toBe(true);
      });

      it('should return false for numbers outside range', () => {
        expect(isNumberInRange(11, 0, 10)).toBe(false);
        expect(isNumberInRange(-1, 0, 10)).toBe(false);
        expect(isNumberInRange(5, 10, 20)).toBe(false);
      });
    });
  });

  describe('Token Validation', () => {
    const validToken: Partial<Token> = {
      id: 'token-1',
      name: 'Test Token',
      ticker: 'TEST',
      description: 'A test token',
      imageUrl: 'https://example.com/image.png',
      creator: '0x1234567890123456789012345678901234567890',
      contractAddress: '0x1234567890123456789012345678901234567890',
      price: 0.00001,
      marketCap: 10000,
      virtualLiquidity: 5000,
      volume: 50000,
      progress: 50,
      createdAt: Date.now(),
      supply: 1000000000,
      boosts: 0,
      securityState: {
        mintRevoked: false,
        freezeRevoked: false,
        lpBurned: false,
      },
      sentiment: {
        bullish: 50,
        bearish: 50,
      },
    };

    it('should validate a complete token', () => {
      expect(validateToken(validToken)).toBe(true);
    });

    it('should reject non-object data', () => {
      expect(validateToken(null)).toBe(false);
      expect(validateToken('string')).toBe(false);
      expect(validateToken(123)).toBe(false);
      expect(validateToken([])).toBe(false);
    });

    it('should reject token missing required string fields', () => {
      const tokenWithoutId = { ...validToken };
      delete (tokenWithoutId as any).id;
      expect(validateToken(tokenWithoutId)).toBe(false);

      const tokenWithoutName = { ...validToken };
      delete (tokenWithoutName as any).name;
      expect(validateToken(tokenWithoutName)).toBe(false);

      const tokenWithoutTicker = { ...validToken };
      delete (tokenWithoutTicker as any).ticker;
      expect(validateToken(tokenWithoutTicker)).toBe(false);
    });

    it('should reject token with invalid price', () => {
      const tokenWithInvalidPrice = { ...validToken, price: -1 };
      expect(validateToken(tokenWithInvalidPrice)).toBe(false);

      const tokenWithZeroPrice = { ...validToken, price: 0 };
      expect(validateToken(tokenWithZeroPrice)).toBe(false);
    });

    it('should reject token with invalid progress', () => {
      const tokenWithNegativeProgress = { ...validToken, progress: -1 };
      expect(validateToken(tokenWithNegativeProgress)).toBe(false);

      const tokenWithOverflowProgress = { ...validToken, progress: 101 };
      expect(validateToken(tokenWithOverflowProgress)).toBe(false);
    });

    it('should accept token with valid isLive boolean', () => {
      const liveToken = { ...validToken, isLive: true };
      expect(validateToken(liveToken)).toBe(true);
    });

    it('should reject token with invalid isLive type', () => {
      const invalidLiveToken = { ...validToken, isLive: 'true' as any };
      expect(validateToken(invalidLiveToken)).toBe(false);
    });

    it('should accept token with valid streamViewers', () => {
      const tokenWithViewers = { ...validToken, isLive: true, streamViewers: 1000 };
      expect(validateToken(tokenWithViewers)).toBe(true);
    });

    it('should reject token with invalid streamViewers', () => {
      const invalidViewersToken = { ...validToken, isLive: true, streamViewers: -1 };
      expect(validateToken(invalidViewersToken)).toBe(false);
    });
  });

  describe('Trade Validation', () => {
    const validTrade: Partial<Trade> = {
      id: 'trade-1',
      type: 'buy',
      amountDC: 1000,
      amountToken: 100000000,
      price: 0.00001,
      user: '0x1234567890123456789012345678901234567890',
      timestamp: Date.now(),
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
      tokenId: 'token-1',
      blockNumber: 100,
      gasUsed: 21000,
    };

    it('should validate a complete trade', () => {
      expect(validateTrade(validTrade)).toBe(true);
    });

    it('should reject non-object data', () => {
      expect(validateTrade(null)).toBe(false);
      expect(validateTrade('string')).toBe(false);
      expect(validateTrade(123)).toBe(false);
    });

    it('should accept valid trade types', () => {
      expect(validateTrade({ ...validTrade, type: 'buy' })).toBe(true);
      expect(validateTrade({ ...validTrade, type: 'sell' })).toBe(true);
      expect(validateTrade({ ...validTrade, type: 'burn' })).toBe(true);
    });

    it('should reject invalid trade type', () => {
      const invalidTrade = { ...validTrade, type: 'invalid' as any };
      expect(validateTrade(invalidTrade)).toBe(false);
    });

    it('should reject trade with invalid price', () => {
      const invalidTrade = { ...validTrade, price: -1 };
      expect(validateTrade(invalidTrade)).toBe(false);
    });

    it('should reject trade with missing required fields', () => {
      const tradeWithoutId = { ...validTrade };
      delete (tradeWithoutId as any).id;
      expect(validateTrade(tradeWithoutId)).toBe(false);
    });
  });

  describe('Comment Validation', () => {
    const validComment: Partial<Comment> = {
      id: 'comment-1',
      text: 'Great token!',
      user: 'user-1',
      tokenId: 'token-1',
      timestamp: Date.now(),
    };

    it('should validate a complete comment', () => {
      expect(validateComment(validComment)).toBe(true);
    });

    it('should reject non-object data', () => {
      expect(validateComment(null)).toBe(false);
      expect(validateComment('string')).toBe(false);
    });

    it('should reject comment missing required fields', () => {
      const commentWithoutContent = { ...validComment };
      delete (commentWithoutContent as any).text;
      expect(validateComment(commentWithoutContent)).toBe(false);
    });

    it('should reject comment with text exceeding max length', () => {
      const longComment = {
        ...validComment,
        text: 'a'.repeat(1001)
      };
      expect(validateComment(longComment)).toBe(false);
    });

    it('should accept comment with max length text', () => {
      const maxComment = {
        ...validComment,
        text: 'a'.repeat(1000)
      };
      expect(validateComment(maxComment)).toBe(true);
    });
  });

  describe('Price Validation', () => {
    it('should validate valid prices', () => {
      expect(validatePrice(0.000001)).toBe(true);
      expect(validatePrice(0.00001)).toBe(true);
      expect(validatePrice(1)).toBe(true);
      expect(validatePrice(10)).toBe(true);
    });

    it('should reject non-number prices', () => {
      expect(validatePrice('string' as any)).toBe(false);
      expect(validatePrice(null as any)).toBe(false);
      expect(validatePrice(undefined as any)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validatePrice(NaN)).toBe(false);
    });

    it('should reject negative prices', () => {
      expect(validatePrice(-0.00001)).toBe(false);
      expect(validatePrice(-1)).toBe(false);
    });

    it('should reject zero price', () => {
      expect(validatePrice(0)).toBe(false);
    });

    it('should reject prices outside reasonable range', () => {
      expect(validatePrice(0.0000001)).toBe(false); // Too low
      expect(validatePrice(100)).toBe(false); // Too high
    });
  });

  describe('sanitizeAPIResponse', () => {
    it('should return data if validation passes', () => {
      const data = { key: 'value' };
      const validator = (d: unknown): d is { key: string } =>
        typeof d === 'object' && d !== null && 'key' in d;

      const result = sanitizeAPIResponse(data, validator, 'test');
      expect(result).toEqual(data);
    });

    it('should throw error if validation fails', () => {
      const data = { invalid: 'data' };
      const validator = (d: unknown): d is { key: string } =>
        typeof d === 'object' && d !== null && 'key' in d;

      expect(() => {
        sanitizeAPIResponse(data, validator, 'test');
      }).toThrow('Invalid API response for test');
    });
  });

  describe('validateArray', () => {
    it('should validate array of valid items', () => {
      const data = [1, 2, 3];
      const validator = (d: unknown): d is number => typeof d === 'number';

      expect(validateArray(data, validator)).toBe(true);
    });

    it('should reject non-array data', () => {
      const data = 'not an array';
      const validator = (d: unknown): d is number => typeof d === 'number';

      expect(validateArray(data, validator)).toBe(false);
    });

    it('should reject array with invalid items', () => {
      const data = [1, 2, 'invalid' as any];
      const validator = (d: unknown): d is number => typeof d === 'number';

      expect(validateArray(data, validator)).toBe(false);
    });

    it('should accept empty array', () => {
      const data: any[] = [];
      const validator = (d: unknown): d is number => typeof d === 'number';

      expect(validateArray(data, validator)).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should return valid string', () => {
      expect(sanitizeString('hello world')).toBe('hello world');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should escape HTML characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeString('"quoted"')).toBe('&quot;quoted&quot;');
      expect(sanitizeString("'single'")).toBe('&#x27;single&#x27;');
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizeString(123 as any)).toThrow('Input must be a string');
    });

    it('should throw error for string exceeding max length', () => {
      expect(() => sanitizeString('a'.repeat(1001), 1000)).toThrow('exceeds maximum length');
    });

    it('should accept string at max length', () => {
      const str = 'a'.repeat(1000);
      expect(sanitizeString(str, 1000)).toBe(str);
    });
  });

  describe('isValidWalletAddress', () => {
    it('should accept valid Ethereum addresses', () => {
      expect(isValidWalletAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidWalletAddress('0xabcdefABCDEF1234567890123456789012345678')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidWalletAddress('0x123')).toBe(false); // Too short
      expect(isValidWalletAddress('1234567890123456789012345678901234567890')).toBe(false); // Missing 0x
      expect(isValidWalletAddress('0xGHIJKL7890123456789012345678901234567890')).toBe(false); // Invalid chars
      expect(isValidWalletAddress('')).toBe(false); // Empty
      expect(isValidWalletAddress(null as any)).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should accept valid URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
      expect(isValidURL('https://api.example.com/v1/tokens')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('example.com')).toBe(false); // Missing protocol
      expect(isValidURL(null as any)).toBe(false);
    });
  });

  describe('isValidTokenId', () => {
    it('should accept valid token IDs', () => {
      expect(isValidTokenId('token-1')).toBe(true);
      expect(isValidTokenId('token-123')).toBe(true);
      expect(isValidTokenId('token-9999')).toBe(true);
    });

    it('should reject invalid token IDs', () => {
      expect(isValidTokenId('token-')).toBe(false);
      expect(isValidTokenId('token-abc')).toBe(false);
      expect(isValidTokenId('tok-1')).toBe(false);
      expect(isValidTokenId('token1')).toBe(false);
      expect(isValidTokenId('')).toBe(false);
      expect(isValidTokenId(null as any)).toBe(false);
    });
  });

  describe('safeJSONParse', () => {
    it('should parse and validate valid JSON', () => {
      const json = '{"key":"value"}';
      const validator = (d: unknown): d is { key: string } =>
        typeof d === 'object' && d !== null && 'key' in d && typeof d.key === 'string';

      const result = safeJSONParse(json, validator);
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const json = '{invalid json}';
      const validator = (d: unknown): d is { key: string } => true;

      const result = safeJSONParse(json, validator);
      expect(result).toBeNull();
    });

    it('should return null if validation fails', () => {
      const json = '{"key":"value"}';
      const validator = (d: unknown): d is { wrong: string } =>
        typeof d === 'object' && d !== null && 'wrong' in d;

      const result = safeJSONParse(json, validator);
      expect(result).toBeNull();
    });
  });

  describe('validateBatch', () => {
    it('should validate all items in batch', () => {
      const items = [1, 2, 3, 4, 5];
      const validator = (d: unknown): d is number => typeof d === 'number';

      const result = validateBatch(items, validator);
      expect(result.valid).toEqual([1, 2, 3, 4, 5]);
      expect(result.invalid).toBe(0);
    });

    it('should separate valid and invalid items', () => {
      const items = [1, 2, 'invalid' as any, 4, 'another' as any];
      const validator = (d: unknown): d is number => typeof d === 'number';

      const result = validateBatch(items, validator);
      expect(result.valid).toEqual([1, 2, 4]);
      expect(result.invalid).toBe(2);
    });

    it('should handle empty array', () => {
      const items: any[] = [];
      const validator = (d: unknown): d is number => typeof d === 'number';

      const result = validateBatch(items, validator);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toBe(0);
    });

    it('should handle all invalid items', () => {
      const items = ['invalid', 'another', 'more'] as any[];
      const validator = (d: unknown): d is number => typeof d === 'number';

      const result = validateBatch(items, validator);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toBe(3);
    });
  });
});
