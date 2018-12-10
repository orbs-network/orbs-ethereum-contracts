import chai from 'chai';
import utils from 'ethereumjs-util';

import MerkleTree from './helpers/merkleTree';

const { expect } = chai;

const CryptoUtilsWrapper = artifacts.require('./CryptoUtilsWrapper.sol');

contract('CryptoUtils', (accounts) => {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  let cryptoUtils;

  beforeEach(async () => {
    cryptoUtils = await CryptoUtilsWrapper.new();
  });

  describe('ECDSA signature validation', async () => {
    const signer = '0xf5486570e389004a726081366396827f56ea5bf1';
    const secretKey = Buffer.from('264306acaa51ab181dd52e9c8822121e4569bbfe4df5937e170aff25d02acb0d', 'hex');

    const signatures = [
      'Hello World!',
      'Hello World 2!',
      'Hello World 3!',
    ].map((message) => {
      const messageHashBuffer = utils.sha256(message);
      const rawSignature = utils.ecsign(messageHashBuffer, secretKey);
      const signature = utils.toRpcSig(rawSignature.v, rawSignature.r, rawSignature.s);

      return {
        messageHash: `0x${messageHashBuffer.toString('hex')}`,
        signature,
      };
    });

    it('should verify correct signatures', async () => {
      for (let i = 0; i < signatures.length; ++i) {
        const signature = signatures[i];
        expect(await cryptoUtils.isSignatureValid.call(signature.messageHash, signature.signature,
          signer)).to.be.true();
      }
    });

    it('should detect incorrect signatures', async () => {
      const correctSignature = signatures[0].signature;
      const correctHash = signatures[0].messageHash;

      const wrongSigner = accounts[5];
      const wrongHash = `0x${utils.sha256('Goodbye World!').toString('hex')}`;
      const wrongSignature = signatures[1].signature;

      expect(await cryptoUtils.isSignatureValid.call(correctHash, correctSignature, wrongSigner)).to.be.false();
      expect(await cryptoUtils.isSignatureValid.call(wrongHash, correctSignature, signer)).to.be.false();
      expect(await cryptoUtils.isSignatureValid.call(correctHash, wrongSignature, signer)).to.be.false();
    });

    it('should return false on a 0x0 address', async () => {
      const signature = signatures[0];
      expect(await cryptoUtils.isSignatureValid.call(signature.messageHash, signature.signature,
        ZERO_ADDRESS)).to.be.false();
    });

    it('should return false on a signature which is too short', async () => {
      const signature = signatures[0];
      expect(await cryptoUtils.isSignatureValid.call(signature.messageHash, signature.signature.slice(0,
        signature.signature.length - 1), signer)).to.be.false();
    });

    it('should return false on a signature which is too long', async () => {
      const signature = signatures[0];
      expect(await cryptoUtils.isSignatureValid.call(signature.messageHash, `${signature.signature}ab`,
        signer)).to.be.false();
    });
  });

  describe('public key to address conversion', async () => {
    it('should convert public keys to addresses', async () => {
      const tests = [
        {
          // eslint-disable-next-line max-len
          publicKey: '0x249edfc95ce1538740d65019864c930a895318efd741cd0299f813f133a2e2e2e8eaf1a65aa3ab8ed698dbd478c02f99c8516595f067be79ed1f6e7823da01f5',
          address: '0x7e196e0c3760e61e9133b7dd524499a91b3e4c3a',
        },
        {
          // eslint-disable-next-line max-len
          publicKey: '0x39176dd1b52cb6c296be894d38d2ed1a305bed5aa071a000db9b51b34ed7b209d1736e93ba106d493a74d65bff40db7b5353210c8ab9c64819ced7757d8ce60b',
          address: '0x215e28e91a9fe0c0239783ad311ced99a143d09c',
        },
        {
          // eslint-disable-next-line max-len
          publicKey: '0x92ed3e7a46722869a6309383a90cb6b20e6ef0835a1d7560a79629f79eab7173bf1d4f4c5e905bcf480bb8e7bc483857b039cfbf25e0ae2530183f61abfb5f7f',
          address: '0xd303aa9f3622b483208c19a2c0617ad17417b4c0',
        },
      ];

      for (let i = 0; i < tests.length; ++i) {
        expect(await cryptoUtils.toAddress.call(tests[i].publicKey)).to.eql(tests[i].address);
      }
    });

    it('should return 0x0 for public key which is too short', async () => {
      // eslint-disable-next-line max-len
      const shortPublicKey = '0x249edfc95ce1538740d65019864c930a895318efd741cd0299f813f133a2e2e2e8eaf1a65aa3ab8ed698dbd478c02f99c8516595f067be79ed1f6e7823da01';
      expect(await cryptoUtils.toAddress.call(shortPublicKey)).to.eql(ZERO_ADDRESS);
    });

    it('should return 0x0 for public key which is too long', async () => {
      // eslint-disable-next-line max-len
      const longPublicKey = '0x92ed3e7a46722869a6309383a90cb6b20e6ef0835a1d7560a79629f79eab7173bf1d4f4c5e905bcf480bb8e7bc483857b039cfbf25e0ae2530183f61abfb5f7faa';
      expect(await cryptoUtils.toAddress.call(longPublicKey)).to.eql(ZERO_ADDRESS);
    });
  });

  describe('Merkle proof validation', async () => {
    [
      {
        elements: ['a', 'b', 'c', 'd', 'e', 'f'],
        existingElements: ['b', 'd'],
      },
      {
        elements: [1, 100, 2, 8, 4, 1000, 2, 5],
        existingElements: [1, 2, 5],
      },
      {
        elements: [1],
        existingElements: [1],
      },
      {
        elements: ['3e7a4', 5, 'aaa', 'Hello', 5, 4, 33, 22, 1, 100],
        existingElements: ['3e7a4', 'Hello'],
      },
    ].forEach((spec) => {
      context(`elements ${JSON.stringify(spec)}`, async () => {
        let merkleTree;
        let root;

        beforeEach(async () => {
          merkleTree = new MerkleTree(spec.elements);
          root = merkleTree.getHexRoot();
        });

        (spec.existingElements).forEach((existing) => {
          let proof;
          beforeEach(async () => {
            proof = merkleTree.getHexProof(existing);
          });

          it(`should verify existence of ${existing}`, async () => {
            expect(await cryptoUtils.isMerkleProofValid.call(proof, root, utils.bufferToHex(existing))).to.be.true();
          });

          it('should fail using different leaf for the same proof', async () => {
            const nonExisting = "I don't exist!";
            expect(await cryptoUtils.isMerkleProofValid.call(proof, root, utils.bufferToHex(nonExisting))).to.be.false();
          });

          it('should fail when using the wrong root', async () => {
            const wrongRoot = utils.bufferToHex(utils.sha256('I am a wrong root!'));
            expect(await cryptoUtils.isMerkleProofValid.call(proof, wrongRoot, utils.bufferToHex(existing))).to.be.false();
          });
        });
      });
    });
  });
});
