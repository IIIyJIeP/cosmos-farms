export type Project = {
  name: string;
  desc: string;
  link: string;
};

export const products: Project[] = [];

export const dependencies: Project[] = [
  {
    name: 'POSTHUMAN',
    desc: 'Decentralized validator and our frends.',
    link: 'https://posthuman.digital/',
  },
  {
    name: 'КриптоБаза | PHMN',
    desc: 'The best crypto community.',
    link: 'https://t.me/Crypto_Base_Chat',
  },
  {
    name: 'X CocmosNibble`s',
    desc: 'CosmoNibble is an educational community that helps crypto enthusiasts navigate the interchain',
    link: 'https://x.com/CosmosNibble',
  },
  {
    name: 'CocmoNibble Chat',
    desc: 'Telegram chat of the CocmosNibble`s community',
    link: 'https://t.me/cosmonibble',
  },
];
